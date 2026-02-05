import { upload } from "../middlewares/multer.js";
import express from 'express';

import { 
    signUp, 
    login, 
    resetPassword, 
    changePassword, 
    getCurrentUserProfile,
    updateAvatar, 
    updateCover, 
    updateUserProfile ,
    getUserProfile,
    getHistory,
    passwordResetRequest
} from "../controllers/user.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/signup", 
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]), 
    signUp
);

router.post("/login", login);

router.post("/password-reset-request", passwordResetRequest);

router.patch("/reset-password/:token", resetPassword);

router.patch("/change-password", changePassword);

router.get("/me", getCurrentUserProfile);

router.put("/me", updateUserProfile);

router.patch("/me/avatar", upload.single('avatar'), updateAvatar);

router.patch("/me/cover", upload.single('cover'), updateCover);

router.get("/c/:username", getUserProfile);

router.get("/history", getHistory);

export default router;

