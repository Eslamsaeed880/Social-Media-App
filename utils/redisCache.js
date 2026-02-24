import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => (retries > 5 ? new Error('Redis reconnection attempts exceeded') : retries * 100),
    },
});

redisClient.on('error', (error) => {
    console.error('Redis client error:', error.message);
});

redisClient.connect().catch((error) => {
    console.error('Redis connection failed:', error.message);
});

const CACHE_INDEX_KEY = 'cache:index';
const CACHE_DEBUG = String(process.env.CACHE_DEBUG || '').toLowerCase() === 'true';

const isRedisAvailable = () => redisClient.isReady;

export const buildCacheKey = (prefix, params = {}) => {
    const sortedEntries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
    const serialized = sortedEntries
        .map(([key, value]) => `${key}=${value ?? ''}`)
        .join('&');

    return `${prefix}:${serialized}`;
};

export const getCache = async (key) => {
    try {
        if (!isRedisAvailable()) {
            return null;
        }

        const cached = await redisClient.get(key);

        if (!cached) {
            return null;
        }

        return JSON.parse(cached);
    } catch (error) {
        console.error('Redis get cache failed:', error.message);
        return null;
    }
};

export const setCache = async (key, payload, ttlSeconds = 60) => {
    try {
        if (!isRedisAvailable()) {
            return;
        }

        await redisClient.set(key, JSON.stringify(payload), { EX: ttlSeconds });
        await redisClient.sAdd(CACHE_INDEX_KEY, key);
    } catch (error) {
        console.error('Redis set cache failed:', error.message);
    }
};

export const invalidateCacheByPrefixes = async (prefixes = []) => {
    try {
        if (!isRedisAvailable() || !prefixes.length) {
            if (CACHE_DEBUG) {
                console.log('[cache:invalidate:skip] redis unavailable or no prefixes');
            }
            return;
        }

        const indexedKeys = await redisClient.sMembers(CACHE_INDEX_KEY);

        if (!indexedKeys.length) {
            if (CACHE_DEBUG) {
                console.log('[cache:invalidate:skip] cache index empty');
            }
            return;
        }

        const keysToDelete = indexedKeys.filter((key) => prefixes.some((prefix) => key.startsWith(prefix)));

        if (!keysToDelete.length) {
            if (CACHE_DEBUG) {
                console.log(`[cache:invalidate:skip] no keys match prefixes: ${prefixes.join(',')}`);
            }
            return;
        }

        if (CACHE_DEBUG) {
            console.log(`[cache:invalidate] prefixes=${prefixes.join(',')} matched=${keysToDelete.length}`);
        }

        const pipeline = redisClient.multi();
        keysToDelete.forEach((key) => pipeline.del(key));
        pipeline.sRem(CACHE_INDEX_KEY, keysToDelete);
        await pipeline.exec();
    } catch (error) {
        console.error('Redis cache invalidation failed:', error.message);
    }
};

export default redisClient;