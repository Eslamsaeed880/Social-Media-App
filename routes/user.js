import { upload } from "../middlewares/multer.js";
import express from 'express';

import { 
    signUp, 
    login, 
    confirmResetPassword, 
    changePassword,
    updateProfilePic, 
    updateCover, 
    updateUserProfile ,
    getUserProfile,
    getHistory,
    resetPassword,
    googleLoginCallback,
} from "../controllers/user.js";
import isAuth from "../middlewares/isAuth.js";
import passport from "passport";

const router = express.Router();

router.post("/signup", 
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]), 
    signUp
);

router.post("/login", login);

router.post("/google", passport.authenticate('google', { scope: ['profile', 'email'] }));

router.post("/google/callback", passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleLoginCallback);

router.post("/password-reset", resetPassword);

router.patch("/confirm-reset-password", confirmResetPassword);

router.patch("/change-password", isAuth, changePassword);

router.get("/history", isAuth, getHistory);

router.get("/@:username", getUserProfile);

router.put("/@:username", isAuth, updateUserProfile);

router.patch("/@:username/profile-pic", isAuth, upload.single('avatar'), updateProfilePic);

router.patch("/@:username/cover", isAuth, upload.single('cover'), updateCover);

export default router;

