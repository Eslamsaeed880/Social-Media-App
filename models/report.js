import mongoose from 'mongoose';

import { Schema } from 'mongoose';

const reportSchema = new Schema({
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User' 
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    description: {
        type: String,
        trim: true,
        maxLength: 1000,
        required: true
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video'
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    },
    reviewNotes: {
        type: String,
        trim: true,
        maxLength: 1000
    }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;