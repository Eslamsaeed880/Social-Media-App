import Joi from 'joi';

/**
 * Watch History Query Validation
 * GET /api/v1/watch-history
 */
export const watchHistoryQuerySchema = Joi.object({
    page: Joi.number()
        .optional()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1',
        }),
    limit: Joi.number()
        .optional()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
});

/**
 * Watch History ID Param Validation
 * DELETE /api/v1/watch-history/:historyId
 */
export const historyIdParamSchema = Joi.object({
    historyId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'History ID is required',
            'string.pattern.base': 'History ID must be a valid MongoDB ObjectId',
            'any.required': 'History ID is required',
        }),
});

export default {
    watchHistoryQuerySchema,
    historyIdParamSchema,
};
