import express from "express";
import { createPlaylist, getUserPlaylists, addVideoToPlaylist, getPlaylistVideos, removeVideoFromPlaylist } from "../controllers/playlist.js";
import isAuth, {isLoggedIn} from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, createPlaylist);

router.get("/:userId/user", isLoggedIn, getUserPlaylists);

router.post("/:playlistId/videos", isAuth, addVideoToPlaylist);

router.get("/:playlistId/videos", isLoggedIn, getPlaylistVideos);

router.delete("/:playlistId/videos/:videoId", isAuth, removeVideoFromPlaylist);

export default router;