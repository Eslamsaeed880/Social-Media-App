import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import Comment from '../models/comment.js';
import Like from '../models/like.js';
import Video from '../models/video.js';

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

        return res.status(201).json(new APIResponse(201, 'Video liked successfully', like));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

