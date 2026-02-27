import express from 'express';
import { clearWatchHistory, deleteWatchHistoryEntry, getWatchHistory } from '../controllers/watchHistory.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';
import { validateRequest } from '../validation/validateRequest.js';
import {
    watchHistoryQuerySchema,
    historyIdParamSchema,
} from '../validation/watchHistoryValidation.js';

const router = express.Router();

router.get("/", isAuth, validateRequest(watchHistoryQuerySchema, 'query'), cache({
    prefix: 'watch-history',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `watch-history:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getWatchHistory);

router.delete("/", isAuth, clearWatchHistory);

router.delete("/:historyId", isAuth, validateRequest(historyIdParamSchema, 'params'), deleteWatchHistoryEntry);

export default router;