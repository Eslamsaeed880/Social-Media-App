import express from 'express';
import {
    createComment,
    replyToComment,
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();


router.post("/:videoId", isAuth, createComment);

router.post("/reply/:commentId", isAuth, replyToComment);

export default router;