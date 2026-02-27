import express from "express";
import { addToWatchLater, getWatchLaterList, removeFromWatchLater } from "../controllers/watchLater.js";
import isAuth from "../middlewares/isAuth.js";
import cache from "../middlewares/cache.js";
import { validateRequest } from "../validation/validateRequest.js";
import {
    addToWatchLaterSchema,
    watchLaterVideoIdParamSchema,
} from "../validation/watchLaterValidation.js";

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

router.post("/", isAuth, validateRequest(addToWatchLaterSchema, 'body'), addToWatchLater);

router.delete("/:videoId", isAuth, validateRequest(watchLaterVideoIdParamSchema, 'params'), removeFromWatchLater);

export default router;