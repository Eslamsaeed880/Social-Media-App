import { buildCacheKey, getCache, setCache } from '../utils/redisCache.js';

const DEFAULT_TTL = Number(process.env.API_CACHE_TTL) || 60;
const CACHE_DEBUG = true

const buildDefaultCacheKey = ({ req, prefix, scope, includeUser }) => {
    const scopePrefix = scope ? `${prefix}:${scope}` : prefix;
    const params = {
        url: req.originalUrl || req.url,
    };

    if (includeUser && req.user?.id) {
        params.userId = req.user.id;
    }

    return buildCacheKey(scopePrefix, params);
};

const cache = ({
    prefix = 'api',
    scope = '',
    ttlSeconds = DEFAULT_TTL,
    includeUser = false,
    keyBuilder = null,
} = {}) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    try {
        const defaultKey = buildDefaultCacheKey({ req, prefix, scope, includeUser });
        const cacheKey = typeof keyBuilder === 'function'
            ? keyBuilder({ req, defaultKey, buildCacheKey })
            : defaultKey;

        const cachedPayload = await getCache(cacheKey);

        if (cachedPayload) {
            if (CACHE_DEBUG) {
                console.log(`[cache:hit] ${req.method} ${req.originalUrl || req.url} -> ${cacheKey}`);
            }
            const statusCode = Number(cachedPayload?.statusCode) || 200;
            return res.status(statusCode).json(cachedPayload);
        }

        if (CACHE_DEBUG) {
            console.log(`[cache:miss] ${req.method} ${req.originalUrl || req.url} -> ${cacheKey}`);
        }

        const originalJson = res.json.bind(res);

        res.json = (body) => {
            const isSuccessStatus = res.statusCode >= 200 && res.statusCode < 300;

            if (isSuccessStatus) {
                if (CACHE_DEBUG) {
                    console.log(`[cache:set] ${req.method} ${req.originalUrl || req.url} -> ${cacheKey} (${ttlSeconds}s)`);
                }
                setCache(cacheKey, body, ttlSeconds);
            } else if (CACHE_DEBUG) {
                console.log(`[cache:skip] ${req.method} ${req.originalUrl || req.url} -> status ${res.statusCode}`);
            }

            return originalJson(body);
        };

        return next();
    } catch (error) {
        console.error('Cache middleware failed:', error.message);
        return next();
    }
};

export default cache;