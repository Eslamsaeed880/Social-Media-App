import express from 'express';
import {
    getAllVideos,
    postVideo,
    getVideoById,
    togglePublishVideo,
    updateVideo,
} from '../controllers/video.js';
import isAuth, { isLoggedIn } from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();

router.get("/", isLoggedIn, getVideoById);

router.get("/", getAllVideos);

router.post("/", isAuth, upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), postVideo);

router.put("/:id", isAuth, updateVideo);

router.patch("/:id", isAuth, togglePublishVideo);

export default router;
