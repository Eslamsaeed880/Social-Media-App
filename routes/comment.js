import express from 'express';
import {
    createCommentOnVideo,
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/:videoId", isAuth, createCommentOnVideo);

export default router;