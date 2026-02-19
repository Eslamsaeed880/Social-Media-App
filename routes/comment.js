import express from 'express';
import {
    createComment,
    replyToComment,
    updateComment,
    deleteComment,
    getReplies,
    getCommentsOfVideo
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/video/:videoId", getCommentsOfVideo)

router.post("/:videoId", isAuth, createComment);

router.post("/reply/:commentId", isAuth, replyToComment);

router.patch("/:commentId", isAuth, updateComment);

router.delete("/:commentId", isAuth, deleteComment);

router.get("/reply/:commentId", getReplies);

export default router;