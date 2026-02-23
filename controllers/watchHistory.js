import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import WatchHistory from '../models/watchHistory.js';

// @Desc: Get user's watch history
// Route: GET /api/v1/watch-history?page=1&limit=10
// Access: Private
export const getWatchHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { user } = req;

        const watchHistory = await WatchHistory.find({ user: user._id })
            .populate('videoId', 'title thumbnail duration')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ watchedAt: -1 });

        const totalHistory = await WatchHistory.countDocuments({ user: user._id });
        
        return res.status(200).json(new APIResponse(200, { watchHistory, totalHistory, page, limit }, 'Watch history retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}
