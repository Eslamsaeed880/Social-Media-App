import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Comment from "../models/comment.js";
import Video from "../models/video.js";
import mongoose from "mongoose"

// @Desc: Create a comment on a video or reply to an existing comment
// @Route: POST /api/v1/comments?v=698f5cf25d9ca8736cff857e&c=698faf3579a3dda5f68c5ca9
// @Access: Private
export const createComment = async (req, res, next) => {
    try {
        const videoId = req.query.v, commentId = req.query.c;
        const { content } = req.body;
        
        let comment, video;
        
        if(commentId) {
            const parentComment = await Comment.findById(commentId);

            if(!parentComment) {
                return next(new APIError(404, 'Parent comment not found'));
            }

            video = await Video.findById(parentComment.videoId);

            if (!video) {
                return next(new APIError(404, 'Video not found'));
            }

            parentComment.replies.push(new mongoose.Types.ObjectId(commentId));
            await parentComment.save();

            comment = new Comment({
                content,
                videoId: parentComment.videoId,
                createdBy: req.user.id,
            });
        } else if(videoId) {
            video = await Video.findById(videoId);

            if (!video) {
                return next(new APIError(404, 'Video not found'));
            }

            comment = new Comment({
                content,
                videoId: video._id,
                createdBy: req.user.id,
            });
        }

        await comment.save();
        await video.save();

        return res.status(201).json(new APIResponse(201, 'Comment created successfully', comment));
        
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}
