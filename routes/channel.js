import express from 'express';
import { getChannelAnalytics } from '../controllers/channel.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.use(isAuth);

router.get('/analytics', getChannelAnalytics);

export default router;