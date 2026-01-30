import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const channelAnalyticsSchema = new Schema({
    channelId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalViews: {
        type: Number,
        default: 0
    },
    totalSubscribers: {
        type: Number,
        default: 0
    },
    totalLikes: {
        type: Number,
        default: 0
    },
    totalComments: {
        type: Number,
        default: 0
    },
    watchTimeMinutes: {
        type: Number,
        default: 0
    },
    topVideos: [{
        videoId: {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        },
        views: Number
    }],
    genderDistribution: {
        male: {
            type: Number,
            default: 0
        },
        female: {
            type: Number,
            default: 0
        }
    },
    dailyStats: [
        {
            date: {
                type: Date,
                required: true
            },
            views: {
                type: Number,
                default: 0
            },
            subscribers: {
                type: Number,
                default: 0
            },
            likes: {
                type: Number,
                default: 0
            },
            comments: {
                type: Number,
                default: 0
            },
            watchTimeMinutes: {
                type: Number,
                default: 0
            }
        }
    ]
}, {timestamps: true});

channelAnalyticsSchema.index({channelId: 1});

const ChannelAnalytics = mongoose.model('ChannelAnalytics', channelAnalyticsSchema);

export default ChannelAnalytics;