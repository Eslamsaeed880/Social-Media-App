import express from 'express';
import { clearWatchHistory, deleteWatchHistoryEntry, getWatchHistory } from '../controllers/watchHistory.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getWatchHistory);

router.delete("/", isAuth, clearWatchHistory);

router.delete("/:historyId", isAuth, deleteWatchHistoryEntry);

export default router;