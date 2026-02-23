import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    channelId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscriberId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

subscriptionSchema.index({ subscriberId: 1, channelId: 1 }, { unique: true });
subscriptionSchema.index({subscriberId: 1}); 
subscriptionSchema.index({channelId: 1}); 
subscriptionSchema.index({subscriberId: 1, createdAt: -1});
subscriptionSchema.index({channelId: 1, createdAt: -1}); 

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;