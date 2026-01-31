import 'dotenv/config';
import express from 'express';
import connectDb from './config/mongodb.js';

const app = express();
const PORT = process.env.PORT || 3000;

connectDb();

app.use(express.json());

// app.use('/api/',);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});