import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;