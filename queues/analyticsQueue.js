import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const analyticsQueue = new Queue('analytics-queue', { connection });

export async function enqueueAnalyticsEvent({
    eventId,
    type,
    channelId,
    videoId = null,
    watchTimeMinutes = 0,
    viewerGender = null,
}) {
    if (!eventId || !type || !channelId) return;

    try {
        console.log('Enqueueing analytics event:', { eventId, type, channelId, videoId });
        const job = await analyticsQueue.add(
            'update-analytics',
            { eventId, type, channelId, videoId, watchTimeMinutes, viewerGender },
            {
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 1000,
                removeOnFail: 3000,
                jobId: eventId,
            }
        );
        console.log('Event enqueued successfully:', job.id);
    } catch (error) {
        console.error('Failed to enqueue event:', error);
        throw error;
    }
}

export default analyticsQueue;
