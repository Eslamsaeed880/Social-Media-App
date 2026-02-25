import mongoose from "mongoose";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Video from "../models/video.js";
import User from "../models/user.js";
import Subscription from "../models/subscription.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import VideoCategory from "../models/videoCategory.js";
import WatchHistory from "../models/watchHistory.js";
import crypto from 'crypto';
import { addToWatchHistory } from "../utils/addToWatchHistory.js";
import { enqueueAnalyticsEvent } from "../queues/analyticsQueue.js";
import { enqueueNotificationEvent } from "../queues/notificationsQueue.js";
import { buildCacheKey, getCache, invalidateCacheByPrefixes } from "../utils/redisCache.js";
import { enqueueMediaJob } from "../queues/mediaQueue.js";
import { computeVideoScore } from "../utils/computeVideoScore.js";

const VIDEO_CACHE_PREFIX = 'videos';
const TRENDING_CACHE_PREFIX = 'videos:trending:computed';
const TRENDING_CACHE_LIMIT = Number(process.env.TRENDING_CACHE_LIMIT) || 50;

const invalidateVideoCaches = async (prefix) => {
    await invalidateCacheByPrefixes(`${VIDEO_CACHE_PREFIX}:${prefix || ''}`);
};

const notifySubscribersForPublishedVideo = async ({ channelId, videoId, videoTitle, publisherUsername }) => {
    const subscriptions = await Subscription.find({
        channelId,
        notificationsEnabled: true,
    }).select('subscriberId').lean();

    if (!subscriptions.length) {
        return;
    }

    await Promise.allSettled(
        subscriptions.map((subscription) => enqueueNotificationEvent({
            eventId: crypto.randomUUID(),
            recipientId: subscription.subscriberId,
            senderId: channelId,
            type: 'video',
            content: `${publisherUsername} published a new video: ${videoTitle}`,
            entityType: 'video',
            entityId: videoId,
        }))
    );
};

// @Desc: Upload a new video
// @route POST /api/v1/videos
// @Access Private
export const postVideo = async (req, res, next) => {
    try {
        const { title, description, tags, category, ageRestriction } = req.body;

        let isPublished = false;
        if(req.body.isPublished === "true") {
            isPublished = true;
        }

        if(!title || !description) {
            return next(new APIError(400, 'Title and description are required'));
        }

        let cat;
        if(category) {
            cat = await VideoCategory.findOne({ name: { $regex: category, $options: "i" } });
            
            if(!cat) {
                VideoCategory.create({ name: category });
                cat = await VideoCategory.findOne({ name: { $regex: category, $options: "i" } });
            }
        }

        if(!req.files || !req.files.videoFile || !req.files.thumbnail) {
            throw new APIError(400, 'Video file and thumbnail are required');
        }

        const videoLocalPath = req.files.videoFile[0].path;
        const thumbnailLocalPath = req.files.thumbnail[0].path;

        let formattedTags = [];
        if (tags) {
            try {
                formattedTags = JSON.parse(tags);
            } catch (error) {
                formattedTags = tags.split(',').map(tag => tag.trim());
            }
        }
        const job = await enqueueMediaJob({
            eventId: crypto.randomUUID(),
            type: 'upload-video',
            payload: {
                userId: req.user.id,
                title,
                description,
                tags: formattedTags,
                category: cat?.name || null,
                ageRestriction,
                isPublished,
                videoLocalPath,
                thumbnailLocalPath,
            },
        });

        return res.status(202)
            .json(
                new APIResponse(
                    202,
                    { jobId: job?.id || null },
                    "Video upload queued"
                )
            );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all videos with filtering, sorting, and pagination
// @route  GET /api/v1/videos?page=1&limit=10&query=tutorials&sortedBy=views&sortType=desc&userId=1ef2d3c4b5a6f7g8h9i0j
// @Access Public
export const getAllVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc', userId, query } = req.query;

        let pipeline = [];
        let matchStage = { isPublished: true };

        if(userId) {
            matchStage.publisherId = new mongoose.Types.ObjectId(userId);
        }

        if(query) {
            matchStage.$or = [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { tags : { $regex: query, $options: "i" } },
            ];
        }

        pipeline.push({ $match: matchStage });

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "publisherId",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $first: "$owner" }
                }
            }
        );

        if(sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1,
                },
            });
        }

        const totalResults = await Video.countDocuments(matchStage);

        pipeline.push(
            {
                $skip: (+page - 1) * +limit,
            },
            {
                $limit: +limit,
            }
        );

        const videos = await Video.aggregate(pipeline);

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    videos,
                    totalResults,
                    currentPage: +page,
                    totalPages: Math.ceil(totalResults / +limit),
                },
                "Videos fetched successfully"
            )
        );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get trending videos (global or by category) in a recent time window
// @route GET /api/v1/videos/trending?category=tech
// @Access Public
export const getTrendingVideos = async (req, res, next) => {
    try {
        const { category } = req.query;

        const query = { isPublished: true };
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        const videos = await Video.find(query)
            .populate('publisherId', 'username fullName avatar')
            .lean();

        const scored = videos
            .map((video) => ({
                ...video,
                score: computeVideoScore(video),
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, TRENDING_CACHE_LIMIT);

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    videos: scored.map(({ score, ...video }) => video),
                    totalResults: scored.length,
                    filters: {
                        category: category || null,
                    },
                },
                'Trending videos fetched successfully'
            )
        );
    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get video by ID
// @route GET /api/v1/videos?watch=videoId
// @Access Public
export const getVideoById = async (req, res, next) => {
    try {
        const id = req.params.id;

        if(!id) {
            return next(new APIError(400, 'Video ID is required'));
        }

        const video = await Video.findById(id).populate({
            path: 'publisherId',
            select: 'username fullName avatar',
        });

        if(!video) {
            return next(new APIError(404, 'Video not found'));
        }

        
        if(!video.isPublished && req.user?.id !== video.publisherId._id.toString()) {
            console.log(req.user);
            console.log(video.publisherId.toString());
            return next(new APIError(403, 'You are not allowed to watch this video'));
        }

        if(req.user) {
            await addToWatchHistory(req.user.id, video._id);
            await invalidateCacheByPrefixes([`watch-history:all:${req.user.id}:`]);
        }

        video.views += 1;
        await video.save();

        try {
            await enqueueAnalyticsEvent({
                eventId: crypto.randomUUID(),
                type: 'VIDEO_VIEWED',
                channelId: video.publisherId._id,
                videoId: video._id,
                watchTimeMinutes: Number(video.duration) || 0,
                viewerGender: req.user?.gender || null,
            });
        } catch (analyticsError) {
            console.error('Analytics event failed:', analyticsError);
        }

        return res.status(200).json(
            new APIResponse(
                200,
                { video },
                "Video fetched successfully"
            )
        );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Toggle publish/unpublish video
// @route PATCH /api/v1/videos/:id
// @Access Private
export const togglePublishVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const video = await Video.findById(id);

        if(!video) {
            return next(new APIError(404, 'Video not found'));
        }

        if(video.publisherId.toString() !== req.user.id) {
            return next(new APIError(403, 'You are not allowed to perform this action'));
        }

        video.isPublished = !video.isPublished;
        await video.save();
        await invalidateVideoCaches();

        if (video.isPublished) {
            try {
                const publisher = await User.findById(req.user.id).select('username').lean();

                await notifySubscribersForPublishedVideo({
                    channelId: req.user.id,
                    videoId: video._id,
                    videoTitle: video.title,
                    publisherUsername: publisher?.username || 'A channel',
                });
            } catch (notificationError) {
                console.error('Publish notification event failed:', notificationError);
            }
        }

        return res.status(200).json(
            new APIResponse(
                200,
                { video },
                `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`
            )
        );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Update video details
// @route PATCH /api/v1/videos/:id
// @Access Private
export const updateVideo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const video = await Video.findById(id);

        if(!video) {
            return next(new APIError(404, 'Video not found'));
        }

        if(video.publisherId.toString() !== req.user.id) {
            return next(new APIError(403, 'You are not allowed to perform this action'));
        }

        const attributesToUpdate = ['title', 'description', 'tags', 'category', 'ageRestriction'];

        attributesToUpdate.forEach(attr => {
            if(req.body[attr]) {
                video[attr] = req.body[attr];
            }
        });
        
        await video.save();
        await invalidateVideoCaches();

        return res.status(200).json(
            new APIResponse(
                200,
                { video },
                "Video updated successfully"
            )
        );
    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Delete video
// @route DELETE /api/v1/videos/:id
// @Access Private
export const deleteVideo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const video = await Video.findById(id);

        if(!video) {
            return next(new APIError(404, 'Video not found'));
        }

        if(video.publisherId.toString() !== req.user.id) {
            return next(new APIError(403, 'You are not allowed to perform this action'));
        }

        await deleteFromCloudinary(video.videoFile.publicId);
        await deleteFromCloudinary(video.thumbnail.publicId);
        await video.deleteOne();
        await invalidateVideoCaches();

        return res.status(200).json(
            new APIResponse(
                200,
                "Video deleted successfully"
            )
        );
    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

export const getMyVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc', query } = req.query;
        const userId = req.user.id;

        let pipeline = [];
        let matchStage = { publisherId: req.user.id };

        matchStage.publisherId = new mongoose.Types.ObjectId(userId);

        if(query) {
            matchStage.$or = [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { tags : { $regex: query, $options: "i" } },
            ];
        }

        pipeline.push({ $match: matchStage });

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "publisherId",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $first: "$owner" }
                }
            }
        );

        if(sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1,
                },
            });
        }

        const totalResults = await Video.countDocuments(matchStage);

        pipeline.push(
            {
                $skip: (+page - 1) * +limit,
            },
            {
                $limit: +limit,
            }
        );

        const videos = await Video.aggregate(pipeline);

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    videos,
                    totalResults,
                    currentPage: +page,
                    totalPages: Math.ceil(totalResults / +limit),
                },
                "Videos fetched successfully"
            )
        );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get personalized video recommendations
// @route GET /api/v1/videos/recommendations
// @Access Private
export const getRecommendedVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 12 } = req.query;
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [subscriptions, watchHistory] = await Promise.all([
            Subscription.find({ subscriberId: userId }).select('channelId').lean(),
            WatchHistory.aggregate([
                { $match: { userId } },
                { $sort: { watchedAt: -1 } },
                { $limit: 300 },
                {
                    $lookup: {
                        from: 'videos',
                        localField: 'videoId',
                        foreignField: '_id',
                        as: 'video',
                    }
                },
                { $unwind: '$video' },
                {
                    $project: {
                        _id: 0,
                        watchedAt: 1,
                        videoId: '$video._id',
                        category: '$video.category',
                        publisherId: '$video.publisherId',
                    }
                }
            ]),
        ]);

        const subscribedChannelIds = subscriptions.map((item) => item.channelId.toString());
        const watchedVideoIds = watchHistory.map((item) => item.videoId);

        const categoryWeights = {};
        const publisherWeights = {};

        for (const item of watchHistory) {
            if (item.category) {
                categoryWeights[item.category] = (categoryWeights[item.category] || 0) + 1;
            }

            if (item.publisherId) {
                const publisherKey = item.publisherId.toString();
                publisherWeights[publisherKey] = (publisherWeights[publisherKey] || 0) + 1;
            }
        }

        const preferredCategories = Object.entries(categoryWeights)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name]) => name);

        const historyPreferredPublishers = Object.entries(publisherWeights)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([publisherId]) => new mongoose.Types.ObjectId(publisherId));

        const subscribedObjectIds = subscribedChannelIds.map((id) => new mongoose.Types.ObjectId(id));

        const recommendationMatch = {
            isPublished: true,
            publisherId: { $ne: userId },
        };

        if (watchedVideoIds.length) {
            recommendationMatch._id = { $nin: watchedVideoIds };
        }

        const interestOrConditions = [];

        if (subscribedObjectIds.length) {
            interestOrConditions.push({ publisherId: { $in: subscribedObjectIds } });
        }

        if (historyPreferredPublishers.length) {
            interestOrConditions.push({ publisherId: { $in: historyPreferredPublishers } });
        }

        if (preferredCategories.length) {
            interestOrConditions.push({ category: { $in: preferredCategories } });
        }

        const candidateFetchLimit = Math.max(parsedPage * parsedLimit * 6, 120);

        const fetchCandidates = async (match, limitCount) => {
            return Video.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $limit: limitCount },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'publisherId',
                        foreignField: '_id',
                        as: 'owner',
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    fullName: 1,
                                    avatar: 1,
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields: {
                        owner: { $first: '$owner' },
                    }
                }
            ]);
        };

        const personalizedMatch = interestOrConditions.length
            ? { ...recommendationMatch, $or: interestOrConditions }
            : recommendationMatch;

        const personalizedCandidates = await fetchCandidates(personalizedMatch, candidateFetchLimit);

        const fallbackExcludeIds = personalizedCandidates.map((video) => video._id);
        const fallbackMatch = {
            isPublished: true,
            publisherId: { $ne: userId },
            _id: { $nin: [...watchedVideoIds, ...fallbackExcludeIds] },
        };

        const fallbackCandidates = personalizedCandidates.length < candidateFetchLimit
            ? await fetchCandidates(fallbackMatch, candidateFetchLimit - personalizedCandidates.length)
            : [];

        const candidates = [...personalizedCandidates, ...fallbackCandidates];

        const now = Date.now();
        const subscribedSet = new Set(subscribedChannelIds);
        const preferredCategoriesSet = new Set(preferredCategories);

        const scoredCandidates = candidates.map((video) => {
            let score = 0;
            const publisherId = video.publisherId?.toString();

            if (publisherId && subscribedSet.has(publisherId)) {
                score += 5;
            }

            const historyPublisherScore = publisherId ? (publisherWeights[publisherId] || 0) : 0;
            score += Math.min(historyPublisherScore, 4) * 0.8;

            if (video.category && preferredCategoriesSet.has(video.category)) {
                score += Math.min(categoryWeights[video.category] || 0, 5) * 0.9;
            }

            const daysSinceCreated = Math.max(
                (now - new Date(video.createdAt).getTime()) / (1000 * 60 * 60 * 24),
                0
            );
            score += Math.max(2 - daysSinceCreated * 0.08, 0);

            score += Math.min((video.views || 0) / 1000, 2);

            return {
                ...video,
                recommendationScore: Number(score.toFixed(3)),
            };
        });

        scoredCandidates.sort((a, b) => b.recommendationScore - a.recommendationScore);

        const startIndex = (parsedPage - 1) * parsedLimit;
        const paginatedVideos = scoredCandidates.slice(startIndex, startIndex + parsedLimit);

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    videos: paginatedVideos,
                    totalResults: scoredCandidates.length,
                    currentPage: parsedPage,
                    totalPages: Math.max(Math.ceil(scoredCandidates.length / parsedLimit), 1),
                    signals: {
                        preferredCategories,
                        subscriptionsCount: subscribedChannelIds.length,
                    }
                },
                'Recommendations fetched successfully'
            )
        );
    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}