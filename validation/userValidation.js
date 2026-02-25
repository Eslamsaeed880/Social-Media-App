import Joi from 'joi';
import { validateRequest } from './validateRequest.js';

/**
 * Sign Up Validation
 * POST /api/v1/users/signup
 */
export const signUpSchema = Joi.object({
    fullName: Joi.string()
        .required()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Full name is required',
            'string.min': 'Full name must be at least 2 characters',
            'string.max': 'Full name cannot exceed 100 characters',
        }),
    username: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username cannot exceed 30 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
        }),
    email: Joi.string()
        .required()
        .trim()
        .email()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
        }),
    password: Joi.string()
        .required()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        }),
}).unknown(true); // Allow files from multer

/**
 * Login Validation
 * POST /api/v1/users/login
 */
export const loginSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .email()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
        }),
    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
        }),
});

/**
 * Update User Profile Validation
 * PUT /api/v1/users/@:username
 */
export const updateUserProfileSchema = Joi.object({
    fullName: Joi.string()
        .optional()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'Full name must be at least 2 characters',
            'string.max': 'Full name cannot exceed 100 characters',
        }),
    bio: Joi.string()
        .optional()
        .trim()
        .max(300)
        .allow('')
        .messages({
            'string.max': 'Bio cannot exceed 300 characters',
        }),
    location: Joi.string()
        .optional()
        .trim()
        .max(100)
        .allow('')
        .messages({
            'string.max': 'Location cannot exceed 100 characters',
        }),
    gender: Joi.string()
        .optional()
        .valid('male', 'female')
        .messages({
            'any.only': 'Gender must be either "male" or "female"',
        }),
    birthDay: Joi.date()
        .optional()
        .max('now')
        .messages({
            'date.max': 'Birth date cannot be in the future',
        }),
    socialLinks: Joi.object({
        x: Joi.string()
            .optional()
            .uri()
            .allow('')
            .messages({
                'string.uri': 'X/Twitter link must be a valid URL',
            }),
        instagram: Joi.string()
            .optional()
            .uri()
            .allow('')
            .messages({
                'string.uri': 'Instagram link must be a valid URL',
            }),
        facebook: Joi.string()
            .optional()
            .uri()
            .allow('')
            .messages({
                'string.uri': 'Facebook link must be a valid URL',
            }),
        website: Joi.string()
            .optional()
            .uri()
            .allow('')
            .messages({
                'string.uri': 'Website must be a valid URL',
            }),
    }).optional(),
});

/**
 * Username Param Validation
 * GET /api/v1/users/@:username
 * PUT /api/v1/users/@:username
 * PATCH /api/v1/users/@:username/profile-pic
 * PATCH /api/v1/users/@:username/cover
 */
export const usernameParamSchema = Joi.object({
    username: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(30)
        .messages({
            'string.empty': 'Username is required',
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username cannot exceed 30 characters',
        }),
});

/**
 * Reset Password Request Validation
 * POST /api/v1/users/password-reset
 */
export const resetPasswordSchema = Joi.object({
    email: Joi.string()
        .required()
        .trim()
        .email()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
        }),
});

/**
 * Confirm Reset Password Validation
 * PATCH /api/v1/users/confirm-reset-password
 */
export const confirmResetPasswordSchema = Joi.object({
    password: Joi.string()
        .required()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        }),
});

/**
 * Reset Token Query Validation
 * PATCH /api/v1/users/confirm-reset-password?token=...
 */
export const resetTokenQuerySchema = Joi.object({
    token: Joi.string()
        .required()
        .hex()
        .length(64)
        .messages({
            'string.empty': 'Reset token is required',
            'string.hex': 'Invalid reset token format',
            'string.length': 'Invalid reset token length',
        }),
});

/**
 * Change Password Validation
 * PATCH /api/v1/users/change-password
 */
export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'string.empty': 'Current password is required',
        }),
    newPassword: Joi.string()
        .required()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .invalid(Joi.ref('currentPassword'))
        .messages({
            'string.empty': 'New password is required',
            'string.min': 'New password must be at least 8 characters',
            'string.max': 'New password cannot exceed 128 characters',
            'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
            'any.invalid': 'New password must be different from current password',
        }),
});

export default {
    signUpSchema,
    loginSchema,
    updateUserProfileSchema,
    usernameParamSchema,
    resetPasswordSchema,
    confirmResetPasswordSchema,
    resetTokenQuerySchema,
    changePasswordSchema,
    validateRequest,
};
