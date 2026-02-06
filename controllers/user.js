import User from '../models/user.js';
import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import config from '../config/config.js';
import transporter from '../config/transporter.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// @Desc: Implement user sign-up logic
// @route: POST /api/v1/users/signup
// Access: Public
export const signUp = async (req, res, next) => {
    try {
        const { fullName, username, email, password } = req.body;

        const exists = await User.findOne({ $or: [ { email }, { username } ] });
        if (exists) {
            return next(new APIError(409, "User with given email or username already exists"));
        }

        let profilePicture = undefined;
        let coverImage = undefined;

        // Handle avatar upload
        if (req.files && req.files['avatar'] && req.files['avatar'][0]) {
            const avatarPath = req.files['avatar'][0].path;
            const uploadedAvatar = await uploadToCloudinary(avatarPath, 'avatars');
            if (uploadedAvatar && uploadedAvatar.url && uploadedAvatar.public_id) {
                profilePicture = {
                    publicId: uploadedAvatar.public_id,
                    url: uploadedAvatar.url
                };
            }
        }

        // Handle cover upload
        if (req.files && req.files['cover'] && req.files['cover'][0]) {
            const coverPath = req.files['cover'][0].path;
            const uploadedCover = await uploadToCloudinary(coverPath, 'covers');
            if (uploadedCover && uploadedCover.url && uploadedCover.public_id) {
                coverImage = {
                    publicId: uploadedCover.public_id,
                    url: uploadedCover.url
                };
            }
        }

        // Only assign profilePicture/coverImage if they are defined and not empty
        const userData = {
            fullName,
            username,
            email,
            password,
        };

        if (profilePicture && profilePicture.publicId && profilePicture.url) {
            userData.profilePicture = profilePicture;
        } else {
            delete userData.profilePicture;
        }
        if (coverImage && coverImage.publicId && coverImage.url) {
            userData.coverImage = coverImage;
        } else {
            delete userData.coverImage;
        }

        await transporter.sendMail({
            to: userData.email,
            from: config.mail.sender,
            subject: 'Welcome to Our Social Media App!',
            html: `<h2>Hi ${username},</h2><br><br>Thank you for signing up for our social media app! We're excited to have you on board.<br><br>Best regards,<br>The Team`
        });

        const newUser = new User(userData);

        await newUser.save();

        const response = new APIResponse(201, { createdUser: newUser }, "User registered successfully");
        res.status(response.statusCode).json(response);

    } catch (error) {
        throw new APIError(500, error.message);
    }
}

// @Desc: Implement user login logic
// @route: POST /api/v1/users/login
// Access: Public
export const login = async (req, res, next) => {
    try {
        const user = req.body;
        
        const existingUser = await User.findOne({ email: user.email });
    
        const isMatch = await existingUser.comparePassword(user.password);
    
        if(isMatch) {
            const token = existingUser.generateToken();
            const response = new APIResponse(200, { user: existingUser, token }, "Login successful");

            res
                .status(response.statusCode)
                .json(response);
        } else {
            return next(new APIError(401, "Invalid email or password"));
        }

    } catch (error) {
        return next(new APIError(401, "Invalid email or password"));
    }
}

// @Desc: Implement Google login callback logic
// @route: GET /api/v1/users/google/callback
// Access: Public
export const googleLoginCallback = async (req, res) => {
    try {
        const token = jwt.sign(
            { 
                id: req.user._id, 
                role: req.user.role 
            }, 
            config.jwtSecretKey, 
            { expiresIn: config.tokenExpiry }
        );
        
        const response = new APIResponse(200, { user: req.user, token }, "Google authentication successful");
        res.status(response.statusCode).json(response);
    } catch (error) {
        return res.status(500).json(new APIResponse(500, null, "Google authentication callback failed", { errors: error.message }));
    }
}

// @Desc: Implement update user profile logic
// @route: PUT /api/v1/users/@:username
// Access: Private
export const updateUserProfile = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('-password -email -resetToken -__v -resetTokenExpiry -authProvider -role -watchedVideos -profilePicture -coverImage');
        if (user._id.toString() === req.user.id) {
            const fields = [
                "fullName",
                "bio",
                "location",
                "gender",
                "birthDay",
                "socialLinks",
            ];

            fields.forEach(field => {
                if (req.body[field] !== undefined) {
                    user[field] = req.body[field];
                }
            });

            await user.save();

            const response = new APIResponse(200, { updatedUser: user }, "User profile updated successfully");
            res.status(response.statusCode).json(response);
        } else {
            return next(new APIError(403, "Unauthorized to update this profile"));
        }
    } catch (error) {
        return next(new APIError(500, "Failed to update user profile", { errors: error.message }));
    }
}

// @Desc: Implement update user profile picture logic
// @route: PATCH /api/v1/users/@:username/profile-pic
// Access: Private
export const updateProfilePic = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User
            .findOne({ username })
            .select('-password -email -resetToken -__v -resetTokenExpiry -authProvider -role -watchedVideos');
    
        if (user._id.toString() !== req.user.id) {
            return next(new APIError(403, "Unauthorized to update this profile"));
        }
    
        if (!req.file) {
            user.profilePicture.publicId = undefined;
            user.profilePicture.url = undefined;
            await user.save();
            const response = new APIResponse(200, { updatedUser: user }, "User avatar removed successfully");
            return res.status(response.statusCode).json(response);
        }
    
        const avatarPath = req.file.path;
        const uploadedAvatar = await uploadToCloudinary(avatarPath, 'avatars');
    
        if (uploadedAvatar && uploadedAvatar.url && uploadedAvatar.public_id) {
            user.profilePicture = {
                publicId: uploadedAvatar.public_id,
                url: uploadedAvatar.url
            };

            await user.save();
            const response = new APIResponse(200, { updatedUser: user }, "User avatar updated successfully");
            res.status(response.statusCode).json(response);
        }
    } catch (error) {
        return next(new APIError(500, "Failed to update user avatar", { errors: error.message }));
    }
}

// @Desc: Implement update user cover logic
// @route: PATCH /api/v1/users/@:username/cover
// Access: Private
export const updateCover = async (req, res, next) => {
    try {
        const { username } = req.params;
        
        const user = await User.findOne({ username, _id: req.user.id }).select('-password -email -resetToken -__v -resetTokenExpiry -authProvider -role -watchedVideos');
    
        if (!user) {
            return next(new APIError(403, "Unauthorized to update this profile"));
        }
    
        if (!req.file) {
            user.coverImage.publicId = undefined;
            user.coverImage.url = undefined;
            await user.save();
            const response = new APIResponse(200, { updatedUser: user }, "User cover image removed successfully");
            return res.status(response.statusCode).json(response);
        }
    
        const coverPath = req.file.path;
        const uploadedCover = await uploadToCloudinary(coverPath, 'covers');
    
        if (uploadedCover && uploadedCover.url && uploadedCover.public_id) {
            user.coverImage = {
                publicId: uploadedCover.public_id,
                url: uploadedCover.url
            };
            await user.save();
            const response = new APIResponse(200, { updatedUser: user }, "User cover image updated successfully");
            res.status(response.statusCode).json(response);
        }

    } catch (error) {
        return next(new APIError(500, "Failed to update user cover image", { errors: error.message }));
    }
}

// @Desc: Implement get user profile by ID logic
// @route: GET /api/v1/users/@:username
// Access: Public
export const getUserProfile = async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).lean().select('-password -email -resetToken -__v -resetTokenExpiry -authProvider -role -watchedVideos');
        return res.status(200).json(new APIResponse(200, { user }, "User profile retrieved successfully"));
    } catch (error) {
        next(error);
    }
}

// @Desc: Implement get user activity history logic
// @route: GET /api/v1/users/history
// Access: Private
export const getHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User
            .findById(userId)
            .select('watchedVideos')
        
        const videos = user.watchedVideos;
        videos.map((v) => {
            v.populate('thumbnail title description views likes duration');
        })

        const response = new APIResponse(200, { history: user.watchedVideos }, "User history retrieved successfully");
        res.status(response.statusCode).json(response);
    } catch (error) {
        next(new APIError(500, "Failed to retrieve user history", { errors: error.message }));
    }
};

// @Desc: Implement password reset request logic
// @route: POST /api/v1/users/password-reset-request
// Access: Private
export const resetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        const resetToken = crypto.randomBytes(32).toString('hex');

        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/confirm-reset-password?token=${resetToken}`;

        await transporter.sendMail({
            to: email,
            from: config.mail.sender,
            subject: 'Password Reset Request',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p>Hello ${user.username},</p>
                    <p>We received a request to reset your password. If you made this request, click the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;
                                  font-weight: bold; font-size: 16px;">
                            Reset My Password
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>This link will expire in 1 hour</strong> for security reasons.
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you didn't request this password reset, please ignore this email. 
                        Your password will remain unchanged.
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #888; font-size: 12px;">
                        If the button above doesn't work, copy and paste this link into your browser:<br>
                        <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
                    </p>
                    
                    <p style="color: #888; font-size: 12px;">
                        This email was sent from our e-commerce platform. Please do not reply to this email.
                    </p>
                </div>
            `
        }, (err, info) => {
            if(!err) {
                console.log("Reset Email Sent Successfully");
            }
        });

        res.status(200).json({
            message: "Password reset email sent successfully. Please check your inbox."
        });

    } catch (error) {
        console.log(error);
        return next(new APIError(500, "Failed to process password reset request", { errors: error.message }));
    }
}

// @Desc: Implement confirm password reset logic
// @route: PATCH /api/v1/users/reset-password
// Access: Private
export const confirmResetPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        const { token } = req.query;

        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() } 
        });

        const saltRounds = parseInt(config.bcryptSaltRounds);
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        await transporter.sendMail({
            to: user.email,
            from: config.mail.sender,
            subject: 'Password Reset Successful',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #28a745;">✅ Password Reset Successful</h2>
                    <p>Hello ${user.name},</p>
                    <p>Your password has been successfully reset. You can now log in with your new password.</p>
                    <p style="color: #666; font-size: 14px;">
                        If you didn't make this change, please contact our support team immediately.
                    </p>
                </div>
            `
        });

        const response = new APIResponse(200, null, "Password reset successful");
        res.status(response.statusCode).json(response);

    } catch (err) {
        console.log(err);
        return next(new APIError(500, "Failed to reset password", { errors: err.message }));
    }
}

// @Desc: Implement change password logic
// @route: PATCH /api/v1/users/change-password
// Access: Private
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);
        const isMatch = await user.comparePassword(currentPassword);
        if(!isMatch) {
            return next(new APIError(400, "Current password is incorrect"));
        }
        
        const saltRounds = parseInt(config.bcryptSaltRounds);
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        
        await user.save();
        const response = new APIResponse(200, null, "Password changed successfully");
        res.status(response.statusCode).json(response);
        
    } catch (error) {
        next(error);
    }
}