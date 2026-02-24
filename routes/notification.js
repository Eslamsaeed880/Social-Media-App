import express from 'express';
import { 
    getNotifications, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
} from '../controllers/notification.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';

const router = express.Router();

router.get("/", isAuth, cache({
    prefix: 'notifications',
    scope: 'all',
    ttlSeconds: 60,
    includeUser: true,
}), getNotifications);

router.patch("/read", isAuth, markAllAsRead);

router.patch("/read/:notificationId", isAuth, markAsRead);

router.delete("/:notificationId", isAuth, deleteNotification);


export default router;