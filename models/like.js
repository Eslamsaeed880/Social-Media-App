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
        required: false
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: false
    }
}, { timestamps: true });

likeSchema.pre('save', function() {
    if(!this.videoId && !this.commentId) {
        throw new Error('Either video or comment must be provided');
    }
    if(this.videoId && this.commentId) {
        throw new Error('Only one of video or comment can be liked at a time');
    }
});

likeSchema.index({ likedBy: 1, videoId: 1 }, { unique: true, sparse: true });

const Like = mongoose.model('Like', likeSchema);

export default Like;