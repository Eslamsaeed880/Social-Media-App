import express from 'express';
import { reportContent } from '../controllers/report.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post('/', isAuth, reportContent);

export default router;