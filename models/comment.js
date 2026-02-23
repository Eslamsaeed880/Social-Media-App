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
        ref: 'Video'
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
        ref: 'Comment',
        cascade: true
    }]
}, { timestamps: true });

commentSchema.index({videoId: 1}); 
commentSchema.index({createdBy: 1});
commentSchema.index({parentComment: 1}); 
commentSchema.index({videoId: 1, createdAt: -1});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;