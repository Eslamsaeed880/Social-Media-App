import 'dotenv/config';
import express from 'express';
import connectDb from './config/mongodb.js';
import userRouter from './routes/user.js';
import { errorHandler, notFound } from './middlewares/error.js';

const app = express();
const PORT = process.env.PORT || 3000;

connectDb();

// Routes
app.use(express.json());
app.use('/api/v1/users', userRouter);

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});