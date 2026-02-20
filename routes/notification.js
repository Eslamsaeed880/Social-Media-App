import express from 'express';
import { getNotifications } from '../controllers/notification.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getNotifications);



export default router;