import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import transporter from '../config/transporter.js';
import config from '../config/config.js';
import { overrideConsoleMethods } from '../utils/logger.js';

overrideConsoleMethods();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

new Worker(
    'email-queue',
    async (job) => {
        const { to, subject, html } = job.data || {};

        if (!to || !subject || !html) {
            console.warn('Invalid email job data');
            return;
        }

        try {
            await transporter.sendMail({
                to,
                from: config.mail.sender,
                subject,
                html,
            });
            console.log('Email sent:', job.id);
        } catch (error) {
            console.error('Email worker error:', job.id, error);
            throw error;
        }
    },
    { connection, concurrency: 5 }
);

console.log('Email worker started');
