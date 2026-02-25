import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import Video from '../models/video.js';
import User from '../models/user.js';
import Subscription from '../models/subscription.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { enqueueNotificationEvent } from '../queues/notificationsQueue.js';
import { invalidateCacheByPrefixes } from '../utils/redisCache.js';
import crypto from 'crypto';

await mongoose.connect(process.env.MONGODB_URI);
console.log('Media worker connected to MongoDB');

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const VIDEO_CACHE_PREFIX = 'videos';
const USER_CACHE_PREFIX = 'users';

const notifySubscribersForPublishedVideo = async ({ channelId, videoId, videoTitle, publisherUsername }) => {
    const subscriptions = await Subscription.find({
        channelId,
        notificationsEnabled: true,
    }).select('subscriberId').lean();

    if (!subscriptions.length) {
        return;
    }

    await Promise.allSettled(
        subscriptions.map((subscription) => enqueueNotificationEvent({
            eventId: crypto.randomUUID(),
            recipientId: subscription.subscriberId,
            senderId: channelId,
            type: 'video',
            content: `${publisherUsername} published a new video: ${videoTitle}`,
            entityType: 'video',
            entityId: videoId,
        }))
    );
};

const safeUnlink = async (filePath) => {
    if (!filePath) {
        return;
    }

    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.warn('Failed to remove local file:', filePath, error?.message || error);
    }
};

new Worker(
    'media-queue',
    async (job) => {
        const { type, payload } = job.data || {};

        if (!type || !payload) {
            console.warn('Invalid media job data');
            return;
        }

        if (type === 'upload-video') {
            const {
                userId,
                title,
                description,
                tags,
                category,
                ageRestriction,
                isPublished,
                videoLocalPath,
                thumbnailLocalPath,
            } = payload;

            if (!userId || !title || !description || !videoLocalPath || !thumbnailLocalPath) {
                console.warn('Invalid video upload payload');
                return;
            }

            const videoUpload = await uploadToCloudinary(videoLocalPath, 'videos');
            if (!videoUpload) {
                throw new Error('Failed to upload video');
            }

            const thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath, 'thumbnails');
            if (!thumbnailUpload) {
                await deleteFromCloudinary(videoUpload.public_id, 'video');
                throw new Error('Failed to upload thumbnail');
            }

            const video = await Video.create({
                title,
                description,
                videoFile: {
                    publicId: videoUpload.public_id,
                    url: videoUpload.url,
                },
                thumbnail: {
                    publicId: thumbnailUpload.public_id,
                    url: thumbnailUpload.url,
                },
                duration: videoUpload.duration,
                publisherId: userId,
                category,
                tags,
                ageRestriction,
                isPublished,
            });

            await invalidateCacheByPrefixes([`${VIDEO_CACHE_PREFIX}:`]);

            if (video.isPublished) {
                const publisher = await User.findById(userId).select('username').lean();
                await notifySubscribersForPublishedVideo({
                    channelId: userId,
                    videoId: video._id,
                    videoTitle: video.title,
                    publisherUsername: publisher?.username || 'A channel',
                });
            }

            await safeUnlink(videoLocalPath);
            await safeUnlink(thumbnailLocalPath);

            console.log('Video upload processed:', job.id);
            return;
        }

        if (type === 'update-profile-pic' || type === 'update-cover') {
            const { userId, username, filePath } = payload;

            if (!userId || !filePath) {
                console.warn('Invalid profile media payload');
                return;
            }

            const folder = type === 'update-profile-pic' ? 'avatars' : 'covers';
            const uploaded = await uploadToCloudinary(filePath, folder);

            if (!uploaded || !uploaded.url || !uploaded.public_id) {
                throw new Error('Failed to upload user media');
            }

            const user = await User.findById(userId);
            if (!user) {
                console.warn('User not found for media update');
                return;
            }

            if (type === 'update-profile-pic') {
                user.profilePicture = { publicId: uploaded.public_id, url: uploaded.url };
            } else {
                user.coverImage = { publicId: uploaded.public_id, url: uploaded.url };
            }

            await user.save();
            await invalidateCacheByPrefixes([`${USER_CACHE_PREFIX}:profile:${username}:`]);

            await safeUnlink(filePath);
            console.log('User media updated:', job.id, type);
            return;
        }

        console.warn('Unknown media job type:', type);
    },
    { connection, concurrency: 2 }
);

console.log('Media worker started');
