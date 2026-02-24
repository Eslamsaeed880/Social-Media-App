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

const router = express.Router();

router.get("/", isAuth, cache({
    prefix: 'subscriptions',
    scope: 'user-subscriptions',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `subscriptions:user-subscriptions:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getUserSubscriptions)

router.post("/", isAuth, subscribeToChannel);

router.delete("/", isAuth, unsubscribeFromChannel);

router.get("/subscribers", isAuth, cache({
    prefix: 'subscriptions',
    scope: 'subscribers',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `subscriptions:subscribers:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getChannelSubscribers);

router.patch("/notifications", isAuth, toggleNotifications);

export default router;