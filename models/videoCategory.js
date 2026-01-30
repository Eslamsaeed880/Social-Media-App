import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const videoCategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 50
    },
    description: {
        type: String,
        trim: true,
        default: ""
    }

}, { timestamps: true });

videoCategorySchema.index({ name: 1 }, { unique: true });

const VideoCategory = mongoose.model('VideoCategory', videoCategorySchema);

export default VideoCategory;