import mongoose from 'mongoose';

import { Schema } from 'monoose';

const reportSchema = new Schema({
    reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    videoId: {
        type: Schema.Types.ObjectId,
        ref: 'Video'
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