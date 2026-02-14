import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Comment from "../models/comment.js";
import Video from "../models/video.js";
import mongoose from "mongoose"

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

        await comment.save();
        await video.save();

        return res.status(201).json(new APIResponse(201, 'Comment created successfully', comment));
        
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
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

        parentComment.replies.push(new mongoose.Types.ObjectId(commentId));
        
        const comment = new Comment({
            content,
            videoId: parentComment.videoId,
            createdBy: req.user.id,
            parentComment: parentComment._id,
        });

        video.comments++;

        await comment.save();
        await parentComment.save();
        await video.save();

        return res.status(201).json(new APIResponse(201, 'Reply created successfully', comment));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
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

        comment.content = content || comment.content;

        await comment.save();
        
        return res.status(200).json(new APIResponse(200, 'Comment updated successfully', comment));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}