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
} from '../controllers/admin.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = express.Router();

router.get('/reports', isAdmin, getAllReports);

router.get('/reports/:reportId', isAdmin, getReportById); 

router.put('/reports/:reportId', isAdmin, updateReportStatus);

router.get('/users', isAdmin, getAllUsers);

router.get('/users/:userId', isAdmin, getUserById);

router.delete('/users/:userId', isAdmin, deleteUser);

router.get('/users/:userId/videos', isAdmin, getVideosByUserId);

router.get('/users/:userId/comments', isAdmin, getCommentsByUserId);

export default router;