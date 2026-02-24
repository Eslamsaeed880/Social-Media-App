import express from 'express';
import { clearWatchHistory, deleteWatchHistoryEntry, getWatchHistory } from '../controllers/watchHistory.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';

const router = express.Router();

router.get("/", isAuth, cache({
    prefix: 'watch-history',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `watch-history:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getWatchHistory);

router.delete("/", isAuth, clearWatchHistory);

router.delete("/:historyId", isAuth, deleteWatchHistoryEntry);

export default router;