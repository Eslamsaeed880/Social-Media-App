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

const router = express.Router();

router.use(isAdmin);

router.get('/reports', getAllReports);

router.get('/reports/:reportId', getReportById); 

router.put('/reports/:reportId', updateReportStatus);

router.get('/users', getAllUsers);

router.get('/users/:userId', getUserById);

router.delete('/users/:userId', deleteUser);

router.get('/users/:userId/videos', getVideosByUserId);

router.get('/users/:userId/comments', getCommentsByUserId);

router.get('/videos', getAllVideos);

router.get('/videos/:videoId', getVideoById);

router.delete('/videos/:videoId', deleteVideo);

router.get('/comments', getAllComments);

router.get('/comments/:commentId', getCommentById);

router.delete('/comments/:commentId', deleteComment);

export default router;