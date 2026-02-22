import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const watchLaterSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    }
}, { timestamps: true });

const WatchLater = mongoose.model('WatchLater', watchLaterSchema);

export default WatchLater;