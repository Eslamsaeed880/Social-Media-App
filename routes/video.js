import express from 'express';
import {
    getAllVideos,
    postVideo,
} from '../controllers/video.js';
import isAuth from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();

router.get("/", getAllVideos);

router.post("/", isAuth, upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), postVideo);

export default router;
