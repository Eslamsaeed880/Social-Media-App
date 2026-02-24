import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import WatchHistory from '../models/watchHistory.js';
import { invalidateCacheByPrefixes } from '../utils/redisCache.js';

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

// @Desc: Delete a watch history entry
// Route: DELETE /api/v1/watch-history/:historyId
// Access: Private
export const deleteWatchHistoryEntry = async (req, res, next) => {
    try {
        const { historyId } = req.params;
        const { user } = req;

        const historyEntry = await WatchHistory.findOne({ _id: historyId, user: user._id });

        if (!historyEntry) {
            return next(new APIError(404, 'Watch history entry not found'));
        }

        await historyEntry.deleteOne();

        await invalidateCacheByPrefixes([`watch-history:all:${user.id}:`]);

        return res.status(200).json(new APIResponse(200, {}, 'Watch history entry deleted successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Clear entire watch history
// Route: DELETE /api/v1/watch-history
// Access: Private
export const clearWatchHistory = async (req, res, next) => {
    try {
        const { user } = req;

        await WatchHistory.deleteMany({ user: user._id });

        await invalidateCacheByPrefixes([`watch-history:all:${user.id}:`]);

        return res.status(200).json(new APIResponse(200, {}, 'Watch history cleared successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}