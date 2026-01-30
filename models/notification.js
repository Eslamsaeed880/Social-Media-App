import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const notificationSchema = new Schema({
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'subscribe', 'video', 'reply'],
        required: true
    },
    content: {
        type: String,
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;