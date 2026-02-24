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
    resetPassword,
    getGoogleAuthUrl,
    googleLoginCallback,
} from "../controllers/user.js";
import isAuth from "../middlewares/isAuth.js";
import passport from "passport";
import cache from "../middlewares/cache.js";

const router = express.Router();
const USER_CACHE_TTL = Number(process.env.USER_CACHE_TTL) || 60;

router.post("/signup", 
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]), 
    signUp
);

router.post("/login", login);

router.get("/google", getGoogleAuthUrl);

router.get("/google/callback", passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleLoginCallback);

router.post("/password-reset", resetPassword);

router.patch("/confirm-reset-password", confirmResetPassword);

router.patch("/change-password", isAuth, changePassword);

router.get("/@:username", cache({
    prefix: 'user',
    scope: 'profile',
    ttlSeconds: USER_CACHE_TTL,
    includeUser: false,
}), getUserProfile);

router.put("/@:username", isAuth, updateUserProfile);

router.patch("/@:username/profile-pic", isAuth, upload.single('avatar'), updateProfilePic);

router.patch("/@:username/cover", isAuth, upload.single('cover'), updateCover);

export default router;

