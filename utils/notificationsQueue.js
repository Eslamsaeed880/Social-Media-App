import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const notificationsQueue = new Queue('notifications-queue', { connection });

export async function enqueueNotificationEvent({
  eventId,
  recipientId,
  senderId,
  type,
  content,
  entityType = null,
  entityId = null,
}) {
  if (!eventId || !recipientId || !senderId || !type || !content) return;

  try {
    const job = await notificationsQueue.add(
      'create-notification',
      { eventId, recipientId, senderId, type, content, entityType, entityId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 3000,
        jobId: eventId,
      }
    );
    console.log('Notification enqueued:', job.id);
  } catch (error) {
    console.error('Failed to enqueue notification:', error);
    throw error;
  }
}

export default notificationsQueue;
