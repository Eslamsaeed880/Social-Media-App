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