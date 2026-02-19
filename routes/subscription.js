import express from 'express';
import { subscribeToChannel, unsubscribeFromChannel, toggleNotifications } from '../controllers/subscription.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, subscribeToChannel);

router.delete("/", isAuth, unsubscribeFromChannel);

router.patch("/notifications", isAuth, toggleNotifications);

export default router;