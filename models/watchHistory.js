import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const watchHistorySchema = new Schema({
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
    watchedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

watchHistorySchema.index({userId: 1, videoId: 1}, { unique: true });
watchHistorySchema.index({userId: 1});
watchHistorySchema.index({videoId: 1});
watchHistorySchema.index({watchedAt: -1});

const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

export default WatchHistory;