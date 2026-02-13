import express from 'express';
import {
    getAllVideos,
    postVideo,
    getVideoById,
    togglePublishVideo,
    updateVideo,
    deleteVideo,
    getMyVideos,
} from '../controllers/video.js';
import isAuth, { isLoggedIn } from '../middlewares/isAuth.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();

router.get("/", getAllVideos);

router.post("/", isAuth, upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), postVideo);

router.get("/my-videos", isAuth, getMyVideos);

router.get("/:id", isLoggedIn, getVideoById);

router.put("/:id", isAuth, updateVideo);

router.patch("/:id", isAuth, togglePublishVideo);

router.delete("/:id", isAuth, deleteVideo);

export default router;
