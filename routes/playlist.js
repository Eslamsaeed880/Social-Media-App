import express from "express";
import { createPlaylist, getUserPlaylists, addVideoToPlaylist } from "../controllers/playlist.js";
import isAuth, {isLoggedIn} from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, createPlaylist);

router.get("/:userId/user", isLoggedIn, getUserPlaylists);

router.post("/:playlistId/video", isAuth, addVideoToPlaylist);

export default router;