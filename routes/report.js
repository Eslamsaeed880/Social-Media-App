import express from 'express';
import { getUserReports, getReportById, reportContent } from '../controllers/report.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';

const router = express.Router();

router.post('/', isAuth, reportContent);

router.get('/', isAuth, cache({
    prefix: 'reports',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `reports:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getUserReports);

router.get('/:reportId', isAuth, cache({
    prefix: 'reports',
    scope: 'report',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `reports:report:${req.params.reportId}:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getReportById);

export default router;