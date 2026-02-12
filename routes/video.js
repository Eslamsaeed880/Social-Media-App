import express from 'express';
import {
    getAllVideos,
} from '../controllers/video.js';

const router = express.Router();

router.get("/", getAllVideos);

export default router;
