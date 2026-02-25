import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import ChannelAnalytics from '../models/channelAnalytics.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Worker connected to MongoDB');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const dayStartUTC = (date = new Date()) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const ensureDaily = (doc, date) => {
    let daily = doc.dailyStats.find(x => x.date.getTime() === date.getTime());
    if (!daily) {
        daily = {
            date,
            views: 0,
            subscribers: 0,
            likes: 0,
            comments: 0,
            watchTimeMinutes: 0,
        };
        doc.dailyStats.push(daily);
    }
    return daily;
};

const clamp = (val) => Math.max(0, val || 0);

const addTopVideoView = (doc, videoId) => {
    if (!videoId) return;
    const hit = doc.topVideos.find(v => String(v.videoId) === String(videoId));
    if (hit) hit.views += 1;
    else doc.topVideos.push({ videoId, views: 1 });

    doc.topVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
    doc.topVideos = doc.topVideos.slice(0, 10);
};

new Worker(
    'analytics-queue',
    async (job) => {
        const { type, channelId, videoId = null, watchTimeMinutes = 0, viewerGender = null } = job.data;

        console.log('Processing job:', job.id, '| Type:', type, '| Channel:', channelId);

        if (!type || !channelId) {
            console.warn('Invalid job data: missing type or channelId');
            return;
        }

        try {
            const analytics = await ChannelAnalytics.findOneAndUpdate(
                { channelId },
                { $setOnInsert: { channelId } },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            const today = dayStartUTC();
            const daily = ensureDaily(analytics, today);

            switch (type) {
                case 'VIDEO_VIEWED':
                    analytics.totalViews = clamp(analytics.totalViews) + 1;
                    daily.views = clamp(daily.views) + 1;
                    analytics.watchTimeMinutes = clamp(analytics.watchTimeMinutes) + watchTimeMinutes;
                    daily.watchTimeMinutes = clamp(daily.watchTimeMinutes) + watchTimeMinutes;
                    if (viewerGender === 'male') analytics.genderDistribution.male += 1;
                    if (viewerGender === 'female') analytics.genderDistribution.female += 1;
                    addTopVideoView(analytics, videoId);
                    break;

                case 'VIDEO_LIKED':
                    analytics.totalLikes = clamp(analytics.totalLikes) + 1;
                    daily.likes = clamp(daily.likes) + 1;
                    break;

                case 'VIDEO_UNLIKED':
                    analytics.totalLikes = clamp(analytics.totalLikes - 1);
                    daily.likes = clamp(daily.likes - 1);
                    break;

                case 'COMMENT_ADDED':
                    analytics.totalComments = clamp(analytics.totalComments) + 1;
                    daily.comments = clamp(daily.comments) + 1;
                    break;

                case 'COMMENT_REMOVED':
                    analytics.totalComments = clamp(analytics.totalComments - 1);
                    daily.comments = clamp(daily.comments - 1);
                    break;

                case 'SUBSCRIBER_ADDED':
                    analytics.totalSubscribers = clamp(analytics.totalSubscribers) + 1;
                    daily.subscribers = clamp(daily.subscribers) + 1;
                    break;

                case 'SUBSCRIBER_REMOVED':
                    analytics.totalSubscribers = clamp(analytics.totalSubscribers - 1);
                    daily.subscribers = clamp(daily.subscribers - 1);
                    break;

                default:
                    return;
            }

            await analytics.save();
            console.log('Analytics updated for channel:', channelId, '| Event:', type);
        } catch (error) {
            console.error('Worker error processing job:', job.id, error);
            throw error;
        }
    },
    { connection, concurrency: 20 }
);

console.log('Analytics worker started');
