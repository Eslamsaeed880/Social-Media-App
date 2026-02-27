import express from "express";
import { 
    createPlaylist, 
    getUserPlaylists, 
    addVideoToPlaylist, 
    getPlaylistVideos, 
    removeVideoFromPlaylist, 
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.js";
import isAuth, {isLoggedIn} from "../middlewares/isAuth.js";
import { validateRequest } from "../validation/validateRequest.js";
import {
    createPlaylistSchema,
    updatePlaylistSchema,
    addVideoToPlaylistSchema,
    playlistIdParamSchema,
    userIdParamSchema,
    playlistAndVideoIdParamSchema,
    playlistVideosQuerySchema,
} from "../validation/playlistValidation.js";

const router = express.Router();

router.post("/", isAuth, validateRequest(createPlaylistSchema, 'body'), createPlaylist);

router.delete("/:playlistId", isAuth, validateRequest(playlistIdParamSchema, 'params'), deletePlaylist);

router.put("/:playlistId", isAuth, validateRequest(playlistIdParamSchema, 'params'), validateRequest(updatePlaylistSchema, 'body'), updatePlaylist);

router.get("/:userId/user", isLoggedIn, validateRequest(userIdParamSchema, 'params'), getUserPlaylists);

router.post("/:playlistId/videos", isAuth, validateRequest(playlistIdParamSchema, 'params'), validateRequest(addVideoToPlaylistSchema, 'body'), addVideoToPlaylist);

router.get("/:playlistId/videos", isLoggedIn, validateRequest(playlistIdParamSchema, 'params'), validateRequest(playlistVideosQuerySchema, 'query'), getPlaylistVideos);

router.delete("/:playlistId/videos/:videoId", isAuth, validateRequest(playlistAndVideoIdParamSchema, 'params'), removeVideoFromPlaylist);

export default router;