import express from 'express';
import { subscribeToChannel } from '../controllers/subscription.js';
import isAuth from '../middlewares/isAuth.js';

const router = express.Router();

router.post("/", isAuth, subscribeToChannel);

export default router;