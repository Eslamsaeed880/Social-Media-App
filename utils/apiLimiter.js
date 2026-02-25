import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from './redisCache.js';

const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 200;

const redisAvailable = () => Boolean(redisClient?.isReady);

const redisStore = new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args),
  prefix: 'rate-limit:api:',
});

const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  store: redisStore,
  skip: () => !redisAvailable(),
});

export default apiLimiter;