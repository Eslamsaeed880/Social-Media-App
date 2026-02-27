import Joi from 'joi';

const objectIdRule = Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.empty': 'ID is required',
        'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
        'any.required': 'ID is required',
    });

const paginationQuerySchema = Joi.object({
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

export const reportIdParamSchema = Joi.object({
    reportId: objectIdRule.messages({
        'string.empty': 'Report ID is required',
        'string.pattern.base': 'Report ID must be a valid MongoDB ObjectId',
        'any.required': 'Report ID is required',
    }),
});

export const userIdParamSchema = Joi.object({
    userId: objectIdRule.messages({
        'string.empty': 'User ID is required',
        'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
        'any.required': 'User ID is required',
    }),
});

export const videoIdParamSchema = Joi.object({
    videoId: objectIdRule.messages({
        'string.empty': 'Video ID is required',
        'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
        'any.required': 'Video ID is required',
    }),
});

export const commentIdParamSchema = Joi.object({
    commentId: objectIdRule.messages({
        'string.empty': 'Comment ID is required',
        'string.pattern.base': 'Comment ID must be a valid MongoDB ObjectId',
        'any.required': 'Comment ID is required',
    }),
});

export const adminReportsQuerySchema = paginationQuerySchema.keys({
    status: Joi.string()
        .optional()
        .valid('pending', 'reviewed', 'resolved')
        .messages({
            'any.only': 'Status must be one of: pending, reviewed, resolved',
        }),
});

export const updateReportStatusSchema = Joi.object({
    status: Joi.string()
        .required()
        .valid('pending', 'reviewed', 'resolved')
        .messages({
            'any.only': 'Status must be one of: pending, reviewed, resolved',
            'any.required': 'Status is required',
        }),
    reviewNotes: Joi.string()
        .optional()
        .trim()
        .allow('')
        .max(1000)
        .messages({
            'string.max': 'Review notes cannot exceed 1000 characters',
        }),
});

export const adminUsersQuerySchema = paginationQuerySchema.keys({
    search: Joi.string().optional().trim().allow('').max(100).messages({
        'string.max': 'Search cannot exceed 100 characters',
    }),
    sort: Joi.string().optional().valid('createdAt', 'username', 'email').default('createdAt').messages({
        'any.only': 'Sort must be one of: createdAt, username, email',
    }),
    order: Joi.string().optional().valid('asc', 'desc').default('desc').messages({
        'any.only': 'Order must be either asc or desc',
    }),
});

export const adminVideosQuerySchema = paginationQuerySchema.keys({
    search: Joi.string().optional().trim().allow('').max(100).messages({
        'string.max': 'Search cannot exceed 100 characters',
    }),
    sort: Joi.string().optional().valid('createdAt', 'title').default('createdAt').messages({
        'any.only': 'Sort must be one of: createdAt, title',
    }),
    order: Joi.string().optional().valid('asc', 'desc').default('desc').messages({
        'any.only': 'Order must be either asc or desc',
    }),
});

export const adminCommentsQuerySchema = paginationQuerySchema.keys({
    search: Joi.string().optional().trim().allow('').max(100).messages({
        'string.max': 'Search cannot exceed 100 characters',
    }),
    sort: Joi.string().optional().valid('createdAt').default('createdAt').messages({
        'any.only': 'Sort must be createdAt',
    }),
    order: Joi.string().optional().valid('asc', 'desc').default('desc').messages({
        'any.only': 'Order must be either asc or desc',
    }),
});

export const userContentQuerySchema = paginationQuerySchema;

export default {
    reportIdParamSchema,
    userIdParamSchema,
    videoIdParamSchema,
    commentIdParamSchema,
    adminReportsQuerySchema,
    updateReportStatusSchema,
    adminUsersQuerySchema,
    adminVideosQuerySchema,
    adminCommentsQuerySchema,
    userContentQuerySchema,
};
