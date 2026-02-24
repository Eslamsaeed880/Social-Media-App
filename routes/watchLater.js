import express from "express";
import { addToWatchLater, getWatchLaterList, removeFromWatchLater } from "../controllers/watchLater.js";
import isAuth from "../middlewares/isAuth.js";
import cache from "../middlewares/cache.js";

const router = express.Router();

router.get("/", isAuth, cache({
    prefix: 'watch-later',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `watch-later:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getWatchLaterList);

router.post("/", isAuth, addToWatchLater);

router.delete("/:videoId", isAuth, removeFromWatchLater);

export default router;