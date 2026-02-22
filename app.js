import 'dotenv/config';
import express from 'express';
import connectDb from './config/mongodb.js';
import userRouter from './routes/user.js';
import videoRouter from './routes/video.js';
import commentRouter from './routes/comment.js';
import likeRouter from './routes/like.js';
import subscriptionRouter from './routes/subscription.js';
import notificationRouter from './routes/notification.js';
import watchLaterRouter from './routes/watchLater.js';
import playlistRouter from './routes/playlist.js';
import { errorHandler, notFound } from './middlewares/error.js';
import passport, { configurePassport } from './middlewares/googleAuth.js';

const app = express();
const PORT = process.env.PORT || 3000;

connectDb();
configurePassport();

// Routes
app.use(express.json());
app.use(passport.initialize());
app.use('/api/v1/users', userRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/watch-later', watchLaterRouter);
app.use('/api/v1/playlists', playlistRouter);

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});