import User from '../models/user.js';
import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import config from '../config/config.js';
import transporter from '../config/transporter.js';

// @Desc: Implement user sign-up logic
// @route: POST /api/v1/users/signup
// Access: Public
export const signUp = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        const exists = await User.findOne({ $or: [ { email }, { username } ] });
        if (exists) {
            throw new APIError(409, "User with given email or username already exists");
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
export const login = async (req, res) => {
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
        }

    } catch (error) {
        throw new APIError(500, error.message);
    }
}

// !@Desc: Implement Google login logic
// @route: POST /api/v1/users/google
// Access: Public
export const googleLogin = async (req, res) => {
    
}

// !@Desc: Implement Google login callback logic
// @route: POST /api/v1/users/google/callback
// Access: Public
export const googleLoginCallback = async (req, res) => {
    
}

// !@Desc: Implement update user profile logic
// @route: PUT /api/v1/users/me
// Access: Private
export const updateUserProfile = async (req, res) => {

}

// !@Desc: Implement update user avatar logic
// @route: PATCH /api/v1/users/me/avatar
// Access: Private
export const updateAvatar = async (req, res) => {
    
}

// !@Desc: Implement update user cover logic
// @route: PATCH /api/v1/users/me/cover
// Access: Private
export const updateCover = async (req, res) => {

}

// !@Desc: Implement get user profile by ID logic
// @route: GET /api/v1/users/:id
// Access: Public
export const getUserProfile = async (req, res) => {

}

// !@Desc: Implement get user activity history logic
// @route: GET /api/v1/users/history
// Access: Private
export const getHistory = async (req, res) => {
}

// !@Desc: Implement password reset request logic
// @route: POST /api/v1/users/password-reset-request
// Access: Private
export const passwordResetRequest = async (req, res) => {
    
}

// !@Desc: Implement password reset logic
// @route: PATCH /api/v1/users/reset-password
// Access: Private
export const resetPassword = async (req, res) => {
    
}

// @Desc: Implement change password logic
// @route: PATCH /api/v1/users/change-password
// Access: Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);
        const isMatch = await user.comparePassword(currentPassword);

        if(!isMatch) {
            throw new APIError(400, "Current password is incorrect");
        }

        user.password = newPassword;
        await user.save();

        const response = new APIResponse(200, null, "Password changed successfully");
        res.status(response.statusCode).json(response);

    } catch (error) {
        throw new APIError(500, error.message);
    }
}