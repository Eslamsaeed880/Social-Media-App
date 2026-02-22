import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Playlist from "../models/playlist.js";
import Video from "../models/video.js";

// @Desc: Create a new playlist
// @Route: POST /api/v1/playlists
// @Access: Private
export const createPlaylist = async (req, res, next) => {
    try {
        const { name, description, videoIds, isPublic, tags } = req.body;
        const userId = req.user.id;

        const playlist = new Playlist({
            name,
            description,
            videos: videoIds,
            isPublic,
            tags,
            createdBy: userId
        });

        await playlist.save();

        return res.status(201).json(new APIResponse(201, playlist, 'Playlist created successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all playlists of a user
// @Route: GET /api/v1/playlists/:userId/user
// @Access: Private
export const getUserPlaylists = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        
        let playlists;
        if(userId === req.user.id) {
            playlists = await Playlist.find({ createdBy: userId });
        } else {
            playlists = await Playlist.find({ createdBy: userId, isPublic: true });
        }

        return res.status(200).json(new APIResponse(200, playlists, 'Playlists fetched successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// Desc: Add a video to a playlist
// Route: POST /api/v1/playlists/:playlistId/videos
// Access: Private
export const addVideoToPlaylist = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { videoId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return next(new APIError(404, 'Playlist not found'));
        }

        if (playlist.createdBy.toString() !== req.user.id) {
            return next(new APIError(403, 'Unauthorized'));
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        if (playlist.videos.includes(videoId)) {
            return next(new APIError(400, 'Video already in playlist'));
        }

        playlist.videos.push(videoId);
        await playlist.save();

        return res.status(200).json(new APIResponse(200, playlist, 'Video added to playlist successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all videos in a playlist
// @Route: GET /api/v1/playlists/:playlistId/videos?limit=10&page=1
// @Access: Private
export const getPlaylistVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { playlistId } = req.params;
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return next(new APIError(404, 'Playlist not found'));
        }
        const videos = await Video.find({ _id: { $in: playlist.videos } }).skip((page - 1) * limit).limit(+limit);
        const totalResults = await Video.countDocuments({ _id: { $in: playlist.videos } });

        return res.status(200).json(new APIResponse(200, { 
            videos, 
            totalResults, 
            currentPage: +page, 
            totalPages: Math.ceil(totalResults / +limit),
        }, 'Videos fetched successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}