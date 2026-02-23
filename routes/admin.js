import express from 'express';
import { getAllReports } from '../controllers/admin.js';
import isAdmin from '../middlewares/isAdmin.js';

const router = express.Router();

router.get('/reports', isAdmin, getAllReports);

export default router;