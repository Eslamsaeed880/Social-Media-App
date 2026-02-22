import express from "express";
import { createPlaylist } from "../controllers/playlist.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, createPlaylist);

export default router;