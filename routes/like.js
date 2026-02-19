import express from 'express';
import { likeVideo, unlikeVideo, likeComment } from '../controllers/like.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, likeVideo);

router.delete("/", isAuth, unlikeVideo);

router.post("/comment", isAuth, likeComment);

export default router;