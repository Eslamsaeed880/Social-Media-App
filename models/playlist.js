import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true,
        maxLength: 100,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: {
        type: [String],
        default: []
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

playlistSchema.index({ createdBy: 1, name: 'text' }, { unique: true });

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;