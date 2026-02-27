import express from 'express';
import { getUserReports, getReportById, reportContent } from '../controllers/report.js';
import isAuth from '../middlewares/isAuth.js';
import cache from '../middlewares/cache.js';
import { validateRequest } from '../validation/validateRequest.js';
import {
    createReportSchema,
    reportsQuerySchema,
    reportIdParamSchema,
} from '../validation/reportValidation.js';

const router = express.Router();

router.post('/', isAuth, validateRequest(createReportSchema, 'body'), reportContent);

router.get('/', isAuth, validateRequest(reportsQuerySchema, 'query'), cache({
    prefix: 'reports',
    scope: 'all',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `reports:all:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getUserReports);

router.get('/:reportId', isAuth, validateRequest(reportIdParamSchema, 'params'), cache({
    prefix: 'reports',
    scope: 'report',
    ttlSeconds: 60,
    keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
        `reports:report:${req.params.reportId}:${req.user.id}`,
        { url: req.originalUrl || req.url }
    ),
}), getReportById);

export default router;