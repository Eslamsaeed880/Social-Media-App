import express from 'express';
import { 
    getNotifications, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
} from '../controllers/notification.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';
import { validateRequest } from '../validation/validateRequest.js';
import {
    notificationIdParamSchema,
    notificationsQuerySchema,
} from '../validation/notificationValidation.js';

const router = express.Router();

router.get("/", isAuth, validateRequest(notificationsQuerySchema, 'query'), cache({
    prefix: 'notifications',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `notifications:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getNotifications);

router.patch("/read", isAuth, markAllAsRead);

router.patch("/read/:notificationId", isAuth, validateRequest(notificationIdParamSchema, 'params'), markAsRead);

router.delete("/:notificationId", isAuth, validateRequest(notificationIdParamSchema, 'params'), deleteNotification);


export default router;