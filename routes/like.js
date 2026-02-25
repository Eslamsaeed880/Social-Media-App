import express from 'express';
import { likeVideo, unlikeVideo, likeComment, unlikeComment } from '../controllers/like.js';
import isAuth from '../middlewares/isAuth.js';
import {
    videoLikeSchema,
    commentLikeSchema,
} from '../validation/likeValidation.js';
import { validateRequest } from '../validation/validateRequest.js';

const router = express.Router();

router.post("/", isAuth, validateRequest(videoLikeSchema, 'body'), likeVideo);

router.delete("/", isAuth, validateRequest(videoLikeSchema, 'body'), unlikeVideo);

router.post("/comment", isAuth, validateRequest(commentLikeSchema, 'body'), likeComment);

router.delete("/comment", isAuth, validateRequest(commentLikeSchema, 'body'), unlikeComment);

export default router;