import { upload } from "../middlewares/multer.js";
import express from 'express';

import { 
    signUp, 
    login, 
    resetPassword, 
    changePassword,
    updateAvatar, 
    updateCover, 
    updateUserProfile ,
    getUserProfile,
    getHistory,
    passwordResetRequest,
    googleLogin,
    googleLoginCallback,
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

router.post("/google", googleLogin);

router.post("/google/callback", googleLoginCallback);

router.post("/password-reset-request", passwordResetRequest);

router.patch("/reset-password/:token", resetPassword);

router.patch("/change-password", isAuth, changePassword);

router.get("/history", isAuth, getHistory);

router.get("/:username", getUserProfile);

router.put("/:username", isAuth, updateUserProfile);

router.patch("/:username/avatar", isAuth, upload.single('avatar'), updateAvatar);

router.patch("/:username/cover", isAuth, upload.single('cover'), updateCover);
export default router;

