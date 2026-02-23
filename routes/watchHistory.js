import express from 'express';
import { getWatchHistory } from '../controllers/watchHistory.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getWatchHistory);

export default router;