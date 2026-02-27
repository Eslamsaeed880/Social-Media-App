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
import { validateRequest } from '../validation/validateRequest.js';
import {
    reportIdParamSchema,
    userIdParamSchema,
    videoIdParamSchema,
    commentIdParamSchema,
    adminReportsQuerySchema,
    updateReportStatusSchema,
    adminUsersQuerySchema,
    adminVideosQuerySchema,
    adminCommentsQuerySchema,
    userContentQuerySchema,
} from '../validation/adminValidation.js';

const router = express.Router();

router.use(isAdmin);

router.get('/reports', validateRequest(adminReportsQuerySchema, 'query'), getAllReports);

router.get('/reports/:reportId', validateRequest(reportIdParamSchema, 'params'), getReportById); 

router.put('/reports/:reportId', validateRequest(reportIdParamSchema, 'params'), validateRequest(updateReportStatusSchema, 'body'), updateReportStatus);

router.get('/users', validateRequest(adminUsersQuerySchema, 'query'), getAllUsers);

router.get('/users/:userId', validateRequest(userIdParamSchema, 'params'), getUserById);

router.delete('/users/:userId', validateRequest(userIdParamSchema, 'params'), deleteUser);

router.get('/users/:userId/videos', validateRequest(userIdParamSchema, 'params'), validateRequest(userContentQuerySchema, 'query'), getVideosByUserId);

router.get('/users/:userId/comments', validateRequest(userIdParamSchema, 'params'), validateRequest(userContentQuerySchema, 'query'), getCommentsByUserId);

router.get('/videos', validateRequest(adminVideosQuerySchema, 'query'), getAllVideos);

router.get('/videos/:videoId', validateRequest(videoIdParamSchema, 'params'), getVideoById);

router.delete('/videos/:videoId', validateRequest(videoIdParamSchema, 'params'), deleteVideo);

router.get('/comments', validateRequest(adminCommentsQuerySchema, 'query'), getAllComments);

router.get('/comments/:commentId', validateRequest(commentIdParamSchema, 'params'), getCommentById);

router.delete('/comments/:commentId', validateRequest(commentIdParamSchema, 'params'), deleteComment);

export default router;