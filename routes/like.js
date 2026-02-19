import express from 'express';
import { likeVideo, unlikeVideo } from '../controllers/like.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, likeVideo);


export default router;