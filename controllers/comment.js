import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Comment from "../models/comment.js";
import Video from "../models/video.js";
import mongoose from "mongoose"

// @Desc: Create a comment on a video
// @Route: POST /api/v1/comments/:videoId
// @Access: Private
export const createCommentOnVideo = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const { content } = req.body;

        const video = await Video.findById(videoId);
        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        video.comments += 1;

        const comment = new Comment({
            content,
            videoId: video._id,
            createdBy: req.user.id,
        });

        await comment.save();
        await video.save();

        return res.status(201).json(new APIResponse(201, 'Comment created successfully', comment));
        
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Reply on a comment
// @Route: POST /api/v1/comments?commentId=698faf3579a3dda5f68c5ca9
// @Access: Private
export const replyOnComment = async (req, res, next) => {
    try {
        const { commentId } = req.query;
        const { content } = req.body;

        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            return next(new APIError(404, 'Comment not found'));
        }

        const comment = new Comment({
            content,
            videoId: parentComment.videoId,
            createdBy: req.user.id,
        });
        
        parentComment.replies.push(new mongoose.Types.ObjectId(comment._id));

        await comment.save();
        await parentComment.save();

        return res.status(201).json(new APIResponse(201, 'Reply created successfully', comment));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}