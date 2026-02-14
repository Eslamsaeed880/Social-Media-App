import express from 'express';
import {
    createCommentOnVideo,
    replyOnComment,
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, replyOnComment);

router.post("/:videoId", isAuth, createCommentOnVideo);



export default router;