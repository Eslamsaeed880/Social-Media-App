import express from "express";
import { addToWatchLater } from "../controllers/watchLater.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, addToWatchLater);

export default router;