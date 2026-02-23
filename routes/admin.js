import express from 'express';
import { 
    getAllReports, 
    updateReportStatus, 
    getReportById 
} from '../controllers/admin.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = express.Router();

router.get('/reports', isAdmin, getAllReports);

router.get('/reports/:reportId', isAdmin, getReportById); 

router.put('/reports/:reportId', isAdmin, updateReportStatus);

export default router;