import Joi from 'joi';

/**
 * Create Report Validation
 * POST /api/v1/reports
 */
export const createReportSchema = Joi.object({
    reason: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(50)
        .messages({
            'string.empty': 'Reason is required',
            'string.max': 'Reason cannot exceed 50 characters',
            'any.required': 'Reason is required',
        }),
    description: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(1000)
        .messages({
            'string.empty': 'Description is required',
            'string.max': 'Description cannot exceed 1000 characters',
            'any.required': 'Description is required',
        }),
    videoId: Joi.string()
        .optional()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'videoId must be a valid MongoDB ObjectId',
        }),
    commentId: Joi.string()
        .optional()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'commentId must be a valid MongoDB ObjectId',
        }),
    reportedUserId: Joi.string()
        .optional()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'reportedUserId must be a valid MongoDB ObjectId',
        }),
})
    .xor('videoId', 'commentId', 'reportedUserId')
    .messages({
        'object.xor': 'You must provide exactly one of videoId, commentId, or reportedUserId',
        'object.missing': 'One of videoId, commentId, or reportedUserId must be provided',
    });

/**
 * Reports Pagination Query Validation
 * GET /api/v1/reports
 */
export const reportsQuerySchema = Joi.object({
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
 * Report ID Param Validation
 * GET /api/v1/reports/:reportId
 */
export const reportIdParamSchema = Joi.object({
    reportId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Report ID is required',
            'string.pattern.base': 'Report ID must be a valid MongoDB ObjectId',
            'any.required': 'Report ID is required',
        }),
});

export default {
    createReportSchema,
    reportsQuerySchema,
    reportIdParamSchema,
};
