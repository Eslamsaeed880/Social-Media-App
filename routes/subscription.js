import express from 'express';
import { subscribeToChannel, unsubscribeFromChannel } from '../controllers/subscription.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, subscribeToChannel);

router.delete("/", isAuth, unsubscribeFromChannel);

export default router;