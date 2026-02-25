import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Comment from "../models/comment.js";
import Video from "../models/video.js";
import mongoose from "mongoose"
import User from "../models/user.js";
import crypto from 'crypto';
import { enqueueNotificationEvent } from "../queues/notificationsQueue.js";
import { enqueueAnalyticsEvent } from "../queues/analyticsQueue.js";

// @Desc: Create a comment on a video
// @Route: POST /api/v1/comments/698fa551362e5de95b8a691c
// @Access: Private
export const createComment = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const { content } = req.body;
        
        const video = await Video.findById(videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        const comment = new Comment({
            content,
            videoId: video._id,
            createdBy: req.user.id,
        });
        
        video.comments++;

        const userCommenter = await User.findById(req.user.id);
        await comment.save();
        await video.save();
        try {
            await enqueueNotificationEvent({
                eventId: crypto.randomUUID(),
                recipientId: video.publisherId,
                senderId: req.user.id,
                type: 'comment',
                content: `${userCommenter.username} commented on your video "${video.title}"`,
                entityType: 'video',
                entityId: video._id,
            });
        } catch (notificationError) {
            console.error('Notification event failed:', notificationError);
        }

        try {
            const analyticsPayload = {
                eventId: crypto.randomUUID(),
                type: 'COMMENT_ADDED',
                channelId: video.publisherId,
                videoId: video._id,
                userId: req.user.id,
            };

            await enqueueAnalyticsEvent(analyticsPayload);
        } catch (analyticsError) {
            console.error('Analytics event failed:', analyticsError);
        }

        return res.status(201).json(new APIResponse(201, 'Comment created successfully', comment));
        
    } catch (error) {
        console.error('Create comment error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}

// @Desc: Reply to an existing comment
// @Route: POST /api/v1/comments/reply/698fa551362e5de95b8a691c
// @Access: Private
export const replyToComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const parentComment = await Comment.findById(commentId);

        if(!parentComment) {
            return next(new APIError(404, 'Parent comment not found'));
        }

        const video = await Video.findById(parentComment.videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        const comment = new Comment({
            content,
            createdBy: req.user.id,
            parentComment: parentComment._id,
        });

        parentComment.replies.push(comment._id);

        video.comments++;

        const userReplier = await User.findById(req.user.id);
        await comment.save();
        await parentComment.save();
        await video.save();
        try {
            await enqueueNotificationEvent({
                eventId: crypto.randomUUID(),
                recipientId: parentComment.createdBy,
                senderId: req.user.id,
                type: 'reply',
                content: `${userReplier.username} replied "${comment.content}" to your comment "${parentComment.content}"`,
                entityType: 'comment',
                entityId: parentComment._id,
            });
        } catch (notificationError) {
            console.error('Notification event failed:', notificationError);
        }

        try {
            await enqueueAnalyticsEvent({
                eventId: crypto.randomUUID(),
                type: 'COMMENT_ADDED',
                channelId: video.publisherId,
                videoId: video._id,
                userId: req.user.id,
            });
        } catch (analyticsError) {
            console.error('Analytics event failed:', analyticsError);
        }

        return res.status(201).json(new APIResponse(201, 'Reply created successfully', comment));

    } catch (error) {
        console.error('Reply to comment error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}


// @Desc: Update a comment
// @Route: PATCH /api/v1/comments/69907f5c2aaf6241eff371fc
// @Access: Private
export const updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);

        if(!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        if(comment.createdBy.toString() !== req.user.id) {
            return next(new APIError(403, 'You are not authorized to update this comment'));
        }

        comment.content = content;

        await comment.save();
        
        return res.status(200).json(new APIResponse(200, 'Comment updated successfully', comment));

    } catch (error) {
        console.error('Update comment error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}

// @Desc: Delete a comment
// @Route: DELETE /api/v1/comments/69907f5c2aaf6241eff371fc
// @Access: Private
export const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if(!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        if(comment.createdBy.toString() !== req.user.id) {
            return next(new APIError(403, 'You are not authorized to delete this comment'));
        }

        let channelId = null;
        if (comment.videoId) {
            const video = await Video.findById(comment.videoId).select('publisherId');
            channelId = video?.publisherId || null;
        }

        await comment.deleteOne();

        if (channelId) {
            try {
                await enqueueAnalyticsEvent({
                    eventId: crypto.randomUUID(),
                    type: 'COMMENT_REMOVED',
                    channelId,
                    videoId: comment.videoId || comment.parentComment,
                    userId: req.user.id,
                });
            } catch (analyticsError) {
                console.error('Analytics event failed:', analyticsError);
            }
        }
        
        return res.status(200).json(new APIResponse(200, 'Comment deleted successfully'));

    } catch (error) {
        console.error('Delete comment error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}

// @Desc: Get replies of a comment
// @Route: GET /api/v1/comments/reply/69907b23e6c79629f9d22a8e
// @Access: Public
export const getReplies = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const parentComment = await Comment.findById(commentId);

        if(!parentComment) {
            return next(new APIError(404, 'Comment not found'));
        }

        const skip = (Number(page) - 1) * Number(limit);
        const paginatedIds = parentComment.replies.slice(skip, skip + Number(limit));

        const replies = await Comment.aggregate([
            {
                $match: {
                    _id: { $in: paginatedIds.map(id => new mongoose.Types.ObjectId(id)) },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: { $first: "$owner" },
                },
            },
        ]);

        const replyMap = new Map();
        replies.forEach(r => replyMap.set(r._id.toString(), r));
        const orderedReplies = paginatedIds
            .map(id => replyMap.get(id.toString()))
            .filter(Boolean);

        const totalReplies = parentComment.replies.length;

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    replies: orderedReplies,
                    totalReplies,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalReplies / Number(limit)),
                },
                'Comment replies fetched successfully'
            )
        );
    } catch (error) {
        console.error('Get replies error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}


// @Desc: Get comments of a video
// @Route: GET /api/v1/comments/video/698fa551362e5de95b8a691c
// @Access: Public
export const getCommentsOfVideo = async (req, res, next) => {
    try { 
        const { videoId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        
        const comments = await Comment.aggregate([
            {
                $match: {
                    videoId: new mongoose.Types.ObjectId(videoId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    owner: { $first: "$owner" },
                    repliesCount: { $size: "$replies" },
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $skip: (parseInt(page) - 1) * parseInt(limit),
            },
            {
                $limit: parseInt(limit),
            },
        ]);
        // Get total comments count
        const totalComments = await Comment.countDocuments({
            videoId: new mongoose.Types.ObjectId(videoId),
        });
        return res.status(200).json(
            new APIResponse(
                200,
                "Comments fetched successfully",
                {
                    comments,
                    totalComments,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalComments / parseInt(limit)),
                }
            )
        );

    } catch (error) {
        console.error('Get comments of video error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}

export const getCommentById = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId).populate('createdBy', 'username fullName avatar');

        if (!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        return res.status(200).json(new APIResponse(200, 'Comment retrieved successfully', comment));

    } catch (error) {
        console.error('Get comment by ID error:', error);
        return next(new APIError(500, error.message || 'Server error'));
    }
}