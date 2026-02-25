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
import {
    postVideoSchema,
    updateVideoSchema,
    getAllVideosSchema,
    getTrendingVideosSchema,
    getVideoByIdSchema,
    videoIdParamSchema,
    getMyVideosSchema,
    getRecommendedVideosSchema,
} from '../validation/videoValidation.js';
import { validateRequest } from '../validation/validateRequest.js';

const router = express.Router();
const VIDEO_CACHE_TTL = Number(process.env.VIDEO_CACHE_TTL) || 60;

router.get("/", validateRequest(getAllVideosSchema, 'query'), cache({ 
    prefix: 'videos', 
    scope: 'all', 
    ttlSeconds: VIDEO_CACHE_TTL 
}), getAllVideos);

router.get("/trending", validateRequest(getTrendingVideosSchema, 'query'), cache({ 
    prefix: 'videos', 
    scope: 'trending', 
    ttlSeconds: VIDEO_CACHE_TTL 
}), getTrendingVideos);

router.post("/", isAuth, validateRequest(postVideoSchema, 'body'), upload.fields([
    { name: 'videoFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), postVideo);

router.get("/my-videos", isAuth, validateRequest(getMyVideosSchema, 'query'), cache({
    prefix: 'videos',
    scope: 'my-videos',
    ttlSeconds: VIDEO_CACHE_TTL,
    includeUser: true,
}), getMyVideos);

router.get("/recommendations", isAuth, validateRequest(getRecommendedVideosSchema, 'query'), cache({
    prefix: 'videos',
    scope: 'recommendations',
    ttlSeconds: VIDEO_CACHE_TTL,
    includeUser: true,
}), getRecommendedVideos);

router.get("/:id", validateRequest(getVideoByIdSchema, 'params'), isLoggedIn, getVideoById);

router.put("/:id", isAuth, validateRequest(videoIdParamSchema, 'params'), validateRequest(updateVideoSchema, 'body'), updateVideo);

router.patch("/:id", isAuth, validateRequest(videoIdParamSchema, 'params'), togglePublishVideo);

router.delete("/:id", isAuth, validateRequest(videoIdParamSchema, 'params'), deleteVideo);

export default router;
