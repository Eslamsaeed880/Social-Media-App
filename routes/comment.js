import express from 'express';
import {
    createComment,
} from '../controllers/comment.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();


router.post("/", isAuth, createComment);



export default router;