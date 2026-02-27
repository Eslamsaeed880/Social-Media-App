import Joi from 'joi';

/**
 * Add to Watch Later Validation
 * POST /api/v1/watch-later
 */
export const addToWatchLaterSchema = Joi.object({
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
 * Video ID Param Validation
 * DELETE /api/v1/watch-later/:videoId
 */
export const watchLaterVideoIdParamSchema = Joi.object({
    videoId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Video ID is required',
            'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
            'any.required': 'Video ID is required',
        }),
});

export default {
    addToWatchLaterSchema,
    watchLaterVideoIdParamSchema,
};
