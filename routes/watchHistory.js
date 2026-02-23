import express from 'express';
import { deleteWatchHistoryEntry, getWatchHistory } from '../controllers/watchHistory.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getWatchHistory);

router.delete("/:historyId", isAuth, deleteWatchHistoryEntry);

export default router;