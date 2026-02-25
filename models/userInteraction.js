import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import UserInterest from './userInterest.js';
import Video from './video.js';

const userInteractionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    action: {
        type: String,
        enum: ['like', 'comment', 'view'],
        required: true
    }
}, { timestamps: true });

// Unique index: userId + videoId + action (allows 3 different actions per video per user)
userInteractionSchema.index({ userId: 1, videoId: 1, action: 1 }, { unique: true });
userInteractionSchema.index({ userId: 1 });
userInteractionSchema.index({ videoId: 1 });

userInteractionSchema.pre('save', async function () {
    try {
        // Only process new documents (not updates)
        if (!this.isNew) {
            return;
        }

        // Check if this exact interaction already exists (same user, video, action)
        const existingInteraction = await UserInteraction.findOne({
            userId: this.userId,
            videoId: this.videoId,
            action: this.action
        });

        // If interaction already exists, don't update interests
        if (existingInteraction) {
            return;
        }

        // Get video to extract category
        const video = await Video.findById(this.videoId).select('category').lean();
        if (!video || !video.category) {
            return;
        }

        const category = video.category.toLowerCase();

        // Weight mapping for different actions
        const weightMap = {
            like: 3,
            comment: 5,
            view: 1
        };
        const weight = weightMap[this.action] || 0;

        // Increment category interest (only for first new action)
        await UserInterest.findOneAndUpdate(
            { userId: this.userId },
            { $inc: { [`interests.${category}`]: weight } },
            { upsert: true, new: true }
        );

        console.log('User interest updated successfully for action:', this.action);
    } catch (error) {
        console.error('Error updating user interest:', error);
    }
});

const UserInteraction = mongoose.model('UserInteraction', userInteractionSchema);

export default UserInteraction;