import express from "express";
import { addToWatchLater, getWatchLaterList, removeFromWatchLater } from "../controllers/watchLater.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/", isAuth, getWatchLaterList);

router.post("/", isAuth, addToWatchLater);

router.delete("/:videoId", isAuth, removeFromWatchLater);

export default router;