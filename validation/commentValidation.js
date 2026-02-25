import Joi from 'joi';
import { validateRequest } from './validateRequest.js';

/**
 * Create Comment Validation
 * POST /api/v1/comments/:videoId
 */
export const createCommentSchema = Joi.object({
    content: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(1000)
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Comment cannot be empty',
            'string.max': 'Comment cannot exceed 1000 characters',
        }),
});

/**
 * Reply to Comment Validation
 * POST /api/v1/comments/reply/:commentId
 */
export const replyToCommentSchema = Joi.object({
    content: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(1000)
        .messages({
            'string.empty': 'Reply content is required',
            'string.min': 'Reply cannot be empty',
            'string.max': 'Reply cannot exceed 1000 characters',
        }),
});

/**
 * Update Comment Validation
 * PATCH /api/v1/comments/:commentId
 */
export const updateCommentSchema = Joi.object({
    content: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(1000)
        .messages({
            'string.empty': 'Comment content is required',
            'string.min': 'Comment cannot be empty',
            'string.max': 'Comment cannot exceed 1000 characters',
        }),
});

/**
 * Video ID Param Validation
 * POST /api/v1/comments/:videoId
 * GET /api/v1/comments/video/:videoId
 */
export const videoIdParamSchema = Joi.object({
    videoId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
            'any.required': 'Video ID is required',
        }),
});

/**
 * Comment ID Param Validation
 * GET/PATCH/DELETE /api/v1/comments/:commentId
 * POST /api/v1/comments/reply/:commentId
 * GET /api/v1/comments/reply/:commentId
 */
export const commentIdParamSchema = Joi.object({
    commentId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Comment ID must be a valid MongoDB ObjectId',
            'any.required': 'Comment ID is required',
        }),
});

/**
 * Pagination Query Validation
 * GET /api/v1/comments/video/:videoId
 * GET /api/v1/comments/reply/:commentId
 */
export const paginationQuerySchema = Joi.object({
    page: Joi.number()
        .optional()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Page must be at least 1',
        }),
    limit: Joi.number()
        .optional()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
});

export default {
    createCommentSchema,
    replyToCommentSchema,
    updateCommentSchema,
    videoIdParamSchema,
    commentIdParamSchema,
    paginationQuerySchema,
    validateRequest,
};
