import express from 'express';
import { likeVideo, unlikeVideo, likeComment, unlikeComment } from '../controllers/like.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, likeVideo);

router.delete("/", isAuth, unlikeVideo);

router.post("/comment", isAuth, likeComment);

router.delete("/comment", isAuth, unlikeComment);

export default router;