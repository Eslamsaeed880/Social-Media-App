import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/config.js';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        publicId: String,
        url: String
    },
    coverImage: {
        publicId: String,
        url: String
    },
    bio: {
        type: String,
        maxLength: 300,
        default: ""
    },
    channelTags: {
        type: [String],
        default: []
    },
    socialLinks: {
        x: String,
        instagram: String,
        facebook: String,
        website: String
    },
    watchedVideos: [    {
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    isVerified: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^(\+?\d{10,15})$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        required: false
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: null
    },
    location: {
        type: String,
        default: ""
    },
    birthDay: {
        type: Date,
        default: null
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        required: true,
        default: 'local'
    },
    role: {
        type: String,
        required: true,
        enum: ['user', 'admin'],
        default: 'user'
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
}, {minimize: false, timestamps: true});

userSchema.pre('save', async function () {
    if(!this.isModified('password')) {
        return ;
    }
    this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.generateToken = function () {
    return jwt.sign({ 
        id: this._id, 
        role: this.role
    }, 
    config.jwtSecretKey, { 
        expiresIn: config.tokenExpiry 
    });
}


const User = mongoose.model('User', userSchema);

export default User;