import express from 'express';
import {
    getAllVideos,
    getTrendingVideos,
    postVideo,
    getVideoById,
    togglePublishVideo,
    updateVideo,
    deleteVideo,
    getMyVideos,
    getRecommendedVideos,
} from '../controllers/video.js';
import isAuth, { isLoggedIn } from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';
import { upload } from '../middlewares/multer.js';

const router = express.Router();
const VIDEO_CACHE_TTL = Number(process.env.VIDEO_CACHE_TTL) || 60;

router.get("/", cache({ 
    prefix: 'videos', 
    scope: 'all', 
    ttlSeconds: VIDEO_CACHE_TTL 
}), getAllVideos);
router.get("/trending", cache({ 
    prefix: 'videos', 
    scope: 'trending', 
    ttlSeconds: VIDEO_CACHE_TTL 
}), getTrendingVideos);

router.post("/", isAuth, upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), postVideo);

router.get("/my-videos", isAuth, cache({
    prefix: 'videos',
    scope: 'my-videos',
    ttlSeconds: VIDEO_CACHE_TTL,
    includeUser: true,
}), getMyVideos);

router.get("/recommendations", isAuth, cache({
    prefix: 'videos',
    scope: 'recommendations',
    ttlSeconds: VIDEO_CACHE_TTL,
    includeUser: true,
}), getRecommendedVideos);

router.get("/:id", isLoggedIn, getVideoById);

router.put("/:id", isAuth, updateVideo);

router.patch("/:id", isAuth, togglePublishVideo);

router.delete("/:id", isAuth, deleteVideo);

export default router;
