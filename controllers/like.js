import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import Comment from '../models/comment.js';
import Like from '../models/like.js';
import Video from '../models/video.js';
import createNotification from '../utils/createNotification.js';

// @Desc: Like a video or comment
// Route: POST /api/v1/likes
// Access: Private
export const likeVideo = async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const { user } = req;

        if (!videoId) {
            return next(new APIError(400, 'Video ID is required'));
        }

        const video = await Video.findById(videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        const existingLike = await Like.findOne({ likedBy: user.id, videoId });

        if (existingLike) {
            return next(new APIError(400, 'You have already liked this video'));
        }

        const like = new Like({
            likedBy: user.id,
            videoId
        });
        
        video.likes++;
        await like.save();
        await video.save();
        await createNotification(video.publisherId, user.id, 'like', `liked your video "${video.title}"`);

        return res.status(201).json(new APIResponse(201, 'Video liked successfully', like));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Unlike a video or comment
// Route: delete /api/v1/likes
// Access: Private
export const unlikeVideo = async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const { user } = req;

        if (!videoId) {
            return next(new APIError(400, 'Video ID is required'));
        }

        const video = await Video.findById(videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }
        
        const existingLike = await Like.findOne({ likedBy: user.id, videoId });

        if (!existingLike) {
            return next(new APIError(400, 'You have not liked this video'));
        }

        await existingLike.deleteOne();
        video.likes--;

        await video.save();

        return res.status(200).json(new APIResponse(200, 'Video unliked successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Like a comment
// Route: POST /api/v1/likes/comment
// Access: Private
export const likeComment = async (req, res, next) => {
    try {
        const { commentId } = req.body;
        const { user } = req;

        if (!commentId) {
            return next(new APIError(400, 'Comment ID is required'));
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        const existingLike = await Like.findOne({ likedBy: user.id, commentId });

        if (existingLike) {
            return next(new APIError(400, 'You have already liked this comment'));
        }

        const like = new Like({
            likedBy: user.id,
            commentId
        });
        
        comment.likes++;

        await like.save();
        await comment.save();
        await createNotification(comment.createdBy, user.id, 'like', `liked your comment "${comment.content}"`);

        return res.status(201).json(new APIResponse(201, 'Comment liked successfully', like));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Unlike a comment
// Route: delete /api/v1/likes/comment
// Access: Private
export const unlikeComment = async (req, res, next) => {
    try {
        const { commentId } = req.body;
        const { user } = req;

        if (!commentId) {
            return next(new APIError(400, 'Comment ID is required'));
        }

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new APIError(404, 'Comment not found'));
        }
        
        const existingLike = await Like.findOne({ likedBy: user.id, commentId });

        if (!existingLike) {
            return next(new APIError(400, 'You have not liked this comment'));
        }

        await existingLike.deleteOne();
        comment.likes--;

        await comment.save();

        return res.status(200).json(new APIResponse(200, 'Comment unliked successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}