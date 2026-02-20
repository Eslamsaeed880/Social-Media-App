import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notification.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getNotifications);

router.patch("/read", isAuth, markAllAsRead);

router.patch("/read/:notificationId", isAuth, );


export default router;