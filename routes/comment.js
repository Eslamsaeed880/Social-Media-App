import express from 'express';
import {
    createComment,
    replyToComment,
    updateComment,
    deleteComment,
    getReplies
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();


router.post("/:videoId", isAuth, createComment);

router.post("/reply/:commentId", isAuth, replyToComment);

router.patch("/:commentId", isAuth, updateComment);

router.delete("/:commentId", isAuth, deleteComment);

router.get("/reply/:commentId", getReplies);

export default router;