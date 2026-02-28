import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import createNotification from '../utils/createNotification.js';
import { invalidateCacheByPrefixes } from '../utils/redisCache.js';
import { overrideConsoleMethods } from '../utils/logger.js';

overrideConsoleMethods();

await mongoose.connect(process.env.MONGODB_URI);
console.log('Notifications worker connected to MongoDB');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

new Worker(
    'notifications-queue',
    async (job) => {
        const { recipientId, senderId, type, content, entityType = null, entityId = null } = job.data;

        if (!recipientId || !senderId || !type || !content) {
            console.warn('Invalid notification job data');
            return;
        }

        try {
            const notification = await createNotification(recipientId, senderId, type, content, entityType, entityId);

            if (notification) {
                await invalidateCacheByPrefixes([`notifications:all:${String(recipientId)}:`]);
            }

            console.log('Notification created:', job.id);
        } catch (error) {
            console.error('Notification worker error:', job.id, error);
            throw error;
        }
    },
    { connection, concurrency: 20 }
);

console.log('Notifications worker started');
