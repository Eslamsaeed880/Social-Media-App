import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-queue', { connection });

export async function enqueueEmailEvent({
    eventId,
    to,
    subject,
    html,
}) {
    if (!to || !subject || !html) {
        return null;
    }

    try {
        const job = await emailQueue.add(
            'send-email',
            { eventId, to, subject, html },
            {
                attempts: 5,
                backoff: { type: 'exponential', delay: 1000 },
                removeOnComplete: 1000,
                removeOnFail: 3000,
                jobId: eventId || undefined,
            }
        );
        console.log('Email enqueued:', job.id);
        return job;
    } catch (error) {
        console.error('Failed to enqueue email:', error);
        throw error;
    }
}

export default emailQueue;
