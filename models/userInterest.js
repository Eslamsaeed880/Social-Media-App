import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const userInterestSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    interests: {
        type: Map, of: Number
    }
});

const UserInterest = mongoose.model('UserInterest', userInterestSchema);

export default UserInterest;