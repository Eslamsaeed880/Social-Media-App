import express from "express";
import { addToWatchLater, getWatchLaterList } from "../controllers/watchLater.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/", isAuth, addToWatchLater);

router.get("/", isAuth, getWatchLaterList);

export default router;