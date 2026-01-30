import mongoose from 'mongoose';
import config from './config.js';

const connectDb = async () => {
    mongoose.connection.on('connected', () => {
        console.log("DB Connected");
    })
    await mongoose.connect(`${config.mongodbUri}/social_media_app`)
}

export default connectDb;