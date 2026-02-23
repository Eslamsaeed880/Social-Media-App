import express from 'express';
import { getAllReports, updateReportStatus } from '../controllers/admin.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = express.Router();

router.get('/reports', isAdmin, getAllReports);

router.put('/reports/:reportId', isAdmin, updateReportStatus);

export default router;