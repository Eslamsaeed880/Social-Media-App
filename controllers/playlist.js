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
// @Route: GET /api/v1/playlists/:userId
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