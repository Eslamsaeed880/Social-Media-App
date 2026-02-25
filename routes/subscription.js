import express from 'express';
import { 
    subscribeToChannel, 
    unsubscribeFromChannel, 
    toggleNotifications, 
    getUserSubscriptions,
    getChannelSubscribers
} from '../controllers/subscription.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';
import { validateRequest } from '../validation/validateRequest.js';
import {
    subscribeSchema,
    unsubscribeSchema,
    toggleNotificationsSchema,
    subscriptionPaginationQuerySchema,
} from '../validation/subscriptionValidation.js';

const router = express.Router();

router.get("/", isAuth, validateRequest(subscriptionPaginationQuerySchema, 'query'), cache({
    prefix: 'subscriptions',
    scope: 'user-subscriptions',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `subscriptions:user-subscriptions:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getUserSubscriptions)

router.post("/", isAuth, validateRequest(subscribeSchema, 'body'), subscribeToChannel);

router.delete("/", isAuth, validateRequest(unsubscribeSchema, 'body'), unsubscribeFromChannel);

router.get("/subscribers", isAuth, validateRequest(subscriptionPaginationQuerySchema, 'query'), cache({
    prefix: 'subscriptions',
    scope: 'subscribers',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `subscriptions:subscribers:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getChannelSubscribers);

router.patch("/notifications", isAuth, validateRequest(toggleNotificationsSchema, 'body'), toggleNotifications);

export default router;