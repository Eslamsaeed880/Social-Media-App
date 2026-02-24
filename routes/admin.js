import express from 'express';
import { 
    getAllReports, 
    updateReportStatus, 
    getReportById,
    getAllUsers,
    getUserById,
    deleteUser,
    getVideosByUserId,
    getCommentsByUserId,
    getAllVideos,
    getVideoById,
    deleteVideo,
    getAllComments,
    getCommentById,
    deleteComment
} from '../controllers/admin.js';
import isAdmin from '../middlewares/isAdmin.js';
import cache from '../middlewares/cache.js';

const router = express.Router();

router.use(isAdmin);

router.get('/reports', cache({
    prefix: 'admin',
    scope: 'reports',
    ttlSeconds: 60,
    includeUser: false,
}), getAllReports);

router.get('/reports/:reportId', cache({
    prefix: 'admin',
    scope: 'reports',
    ttlSeconds: 60,
    includeUser: false,
}), getReportById); 

router.put('/reports/:reportId', updateReportStatus);

router.get('/users', cache({
    prefix: 'admin',
    scope: 'users',
    ttlSeconds: 60,
    includeUser: false,
}), getAllUsers);

router.get('/users/:userId', cache({
    prefix: 'admin',
    scope: 'users',
    ttlSeconds: 60,
    includeUser: false,
}), getUserById);

router.delete('/users/:userId', deleteUser);

router.get('/users/:userId/videos', cache({
    prefix: 'admin',
    scope: 'videos',
    ttlSeconds: 60,
    includeUser: false,
}), getVideosByUserId);

router.get('/users/:userId/comments', cache({
    prefix: 'admin',
    scope: 'comments',
    ttlSeconds: 60,
    includeUser: false,
}), getCommentsByUserId);

router.get('/videos', cache({
    prefix: 'admin',
    scope: 'videos',
    ttlSeconds: 60,
    includeUser: false,
}), getAllVideos);

router.get('/videos/:videoId', cache({
    prefix: 'admin',
    scope: 'videos',
    ttlSeconds: 60,
    includeUser: false,
}), getVideoById);

router.delete('/videos/:videoId', deleteVideo);

router.get('/comments', cache({
    prefix: 'admin',
    scope: 'comments',
    ttlSeconds: 60,
    includeUser: false,
}), getAllComments);

router.get('/comments/:commentId', cache({
    prefix: 'admin',
    scope: 'comments',
    ttlSeconds: 60,
    includeUser: false,
}), getCommentById);

router.delete('/comments/:commentId', deleteComment);

export default router;