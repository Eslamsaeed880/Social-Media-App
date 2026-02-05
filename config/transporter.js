import config from '../config/config.js';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.mail.sender,
        pass: config.mail.password,
    }
});

export default transporter;