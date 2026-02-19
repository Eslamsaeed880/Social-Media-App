import express from 'express';
import { subscribeToChannel, unsubscribeFromChannel, toggleNotifications, getUserSubscriptions } from '../controllers/subscription.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.get("/", isAuth, getUserSubscriptions)

router.post("/", isAuth, subscribeToChannel);

router.delete("/", isAuth, unsubscribeFromChannel);

router.patch("/notifications", isAuth, toggleNotifications);

export default router;