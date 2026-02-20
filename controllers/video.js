import mongoose from "mongoose";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Video from "../models/video.js";
import User from "../models/user.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";
import VideoCategory from "../models/videoCategory.js";

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

        const videoUpload = await uploadToCloudinary(
            videoLocalPath,
            "videos"
        );

        if(!videoUpload) {
            return next(new APIError(500, 'Failed to upload video'));
        }

        const thumbnailUpload = await uploadToCloudinary(
            thumbnailLocalPath,
            "thumbnails"
        );

        if(!thumbnailUpload) {
            await deleteFromCloudinary(videoUpload.public_id);
            return next(new APIError(500, 'Failed to upload thumbnail'));
        }

        let formattedTags = [];
        if (tags) {
            try {
                formattedTags = JSON.parse(tags);
            } catch (error) {
                formattedTags = tags.split(',').map(tag => tag.trim());
            }
        }

        const video = await Video.create({
            title,
            description,
            videoFile: {
                publicId: videoUpload.public_id,
                url: videoUpload.url,
            },
            thumbnail: {
                publicId: thumbnailUpload.public_id,
                url: thumbnailUpload.url,
            },
            duration: videoUpload.duration,
            publisherId: req.user.id,
            category: cat.name,
            tags: formattedTags,
            ageRestriction,
            isPublished,
        });

        return res.status(201)
            .json(
                new APIResponse(
                    201,
                    { video },
                    "Video uploaded successfully"
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
            const user = await User.findById(req.user.id);

            if(user.watchedVideos.some(v => v.toString() === video._id.toString())) {
                await User.findByIdAndUpdate(req.user.id, {
                    $pull: { watchedVideos: video._id }
                });
            } else {
                await User.findByIdAndUpdate(req.user.id, {
                    $push: { watchedVideos: video._id }
                });
            }
        }

        video.views += 1;
        await video.save();

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