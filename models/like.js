import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const likeSchema = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: false
    }
}, { timestamps: true });

likeSchema.pre('save', async function(next) {
    if(!this.videoId && !this.commentId) {
        const err = new Error('Either video or comment must be provided');
        return next(err);
    }
    if(this.videoId && this.commentId) {
        const err = new Error('Only one of video or comment can be liked at a time');
        return next(err);
    }
    
    next();
});

likeSchema.index({ likedBy: 1, videoId: 1 }, { unique: true, sparse: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;