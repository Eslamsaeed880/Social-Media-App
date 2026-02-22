import express from "express";
import { createPlaylist, getUserPlaylists } from "../controllers/playlist.js";
import isAuth, {isLoggedIn} from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, createPlaylist);

router.get("/:userId", isLoggedIn, getUserPlaylists);

export default router;