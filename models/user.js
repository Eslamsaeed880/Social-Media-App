import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const userSchema = new Schema({
    name: {
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
        required: false
    },
    Nationality: {
        type: String,
        required: false
    },
    birthDay: {
        type: Date,
        required: false
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
    }
}, {minimize: false, timestamps: true});

const user = mongoose.model('User', userSchema);

export default user;