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
import {
    signUpSchema,
    loginSchema,
    updateUserProfileSchema,
    usernameParamSchema,
    resetPasswordSchema,
    confirmResetPasswordSchema,
    resetTokenQuerySchema,
    changePasswordSchema,
} from "../validation/userValidation.js";
import { validateRequest } from "../validation/validateRequest.js";

const router = express.Router();
const USER_CACHE_TTL = Number(process.env.USER_CACHE_TTL) || 60;

router.post("/signup", 
    validateRequest(signUpSchema, 'body'),
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]), 
    signUp
);

router.post("/login", validateRequest(loginSchema, 'body'), login);

router.get("/google", getGoogleAuthUrl);

router.get("/google/callback", passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleLoginCallback);

router.post("/password-reset", validateRequest(resetPasswordSchema, 'body'), resetPassword);

router.patch("/confirm-reset-password", 
    validateRequest(resetTokenQuerySchema, 'query'),
    validateRequest(confirmResetPasswordSchema, 'body'),
    confirmResetPassword
);

router.patch("/change-password", isAuth, validateRequest(changePasswordSchema, 'body'), changePassword);

router.get("/@:username", 
    validateRequest(usernameParamSchema, 'params'),
    cache({
        prefix: 'users',
        scope: 'profile',
        ttlSeconds: USER_CACHE_TTL,
        keyBuilder: ({ req, buildCacheKey }) => buildCacheKey(
            `users:profile:${req.params.username}`,
            { url: req.originalUrl || req.url }
        ),
    includeUser: false,
}), getUserProfile);

router.put("/@:username", 
    isAuth, 
    validateRequest(usernameParamSchema, 'params'),
    validateRequest(updateUserProfileSchema, 'body'),
    updateUserProfile
);

router.patch("/@:username/profile-pic", 
    isAuth, 
    validateRequest(usernameParamSchema, 'params'),
    upload.single('avatar'), 
    updateProfilePic
);

router.patch("/@:username/cover", 
    isAuth, 
    validateRequest(usernameParamSchema, 'params'),
    upload.single('cover'), 
    updateCover
);

export default router;

