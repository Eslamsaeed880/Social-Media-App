import Joi from 'joi';

/**
 * Video Like/Unlike Validation
 * POST /api/v1/likes
 * DELETE /api/v1/likes
 */
export const videoLikeSchema = Joi.object({
    videoId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Video ID is required',
            'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
            'any.required': 'Video ID is required',
        }),
});

/**
 * Comment Like/Unlike Validation
 * POST /api/v1/likes/comment
 * DELETE /api/v1/likes/comment
 */
export const commentLikeSchema = Joi.object({
    commentId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Comment ID is required',
            'string.pattern.base': 'Comment ID must be a valid MongoDB ObjectId',
            'any.required': 'Comment ID is required',
        }),
});

export default {
    videoLikeSchema,
    commentLikeSchema,
};
