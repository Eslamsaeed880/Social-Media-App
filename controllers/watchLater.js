import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import WatchLater from "../models/watchLater.js";
import Video from "../models/video.js";

// @Desc: Add a video to the user's watch later list
// @Route: POST /api/v1/watch-later
// @Access: Private
export const addToWatchLater = async (req, res, next) => {
    try {
        const { videoId } = req.body;

        const video = await Video.findById(videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        const existingEntry = await WatchLater.findOne({ userId: req.user.id, videoId });

        if (existingEntry) {
            return next(new APIError(400, 'Video already in watch later list'));
        }

        const watchLaterEntry = new WatchLater({
            userId: req.user.id,
            videoId,
        });

        await watchLaterEntry.save();

        return res.status(201).json(new APIResponse(201, 'Video added to watch later list', watchLaterEntry));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get the user's watch later list
// @Route: GET /api/v1/watch-later
// @Access: Private
export const getWatchLaterList = async (req, res, next) => {
    try {
        const watchLaterList = await WatchLater.find({ userId: req.user.id }).populate('videoId');

        return res.status(200).json(new APIResponse(200, 'Watch later list retrieved successfully', watchLaterList));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}