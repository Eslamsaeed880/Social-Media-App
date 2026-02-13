import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema = new Schema({
    videoFile: {
        publicId: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    thumbnail: {
        publicId: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    title: {
        type: String,
        required: true,
        maxLength: 100,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: Number,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    tags: {
        type: [String],
        default: []
    },
    shares: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publisherId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ageRestriction: {
        type: String,
        enum: ['all', '18+'],
        default: 'all'
    }
}, { timestamps: true });

videoSchema.plugin(mongooseAggregatePaginate);

videoSchema.index({title: 'text', description: 'text', tags: 'text'});

const videoModel = mongoose.model('Video', videoSchema);

export default videoModel;