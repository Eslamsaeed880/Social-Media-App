import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const watchLaterSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    }
}, { timestamps: true });

watchLaterSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const WatchLater = mongoose.model('WatchLater', watchLaterSchema);

export default WatchLater;