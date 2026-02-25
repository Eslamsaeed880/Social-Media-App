import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const mediaQueue = new Queue('media-queue', { connection });

export async function enqueueMediaJob({
    eventId,
    type,
    payload,
}) {
    if (!type || !payload) {
        return null;
    }

    try {
        const job = await mediaQueue.add(
            type,
            { eventId, type, payload },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 1000,
                removeOnFail: 3000,
                jobId: eventId || undefined,
            }
        );
        console.log('Media job enqueued:', job.id, type);
        return job;
    } catch (error) {
        console.error('Failed to enqueue media job:', error);
        throw error;
    }
}

export default mediaQueue;
