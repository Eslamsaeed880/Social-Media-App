import Joi from 'joi';

export const postVideoSchema = Joi.object({
    title: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(100)
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 3 characters',
            'string.max': 'Title cannot exceed 100 characters',
        }),
    description: Joi.string()
        .required()
        .trim()
        .min(10)
        .max(5000)
        .messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters',
            'string.max': 'Description cannot exceed 5000 characters',
        }),
    tags: Joi.alternatives()
        .try(
            Joi.string().trim().allow(''),
            Joi.array().items(Joi.string().trim())
        )
        .optional()
        .default([])
        .messages({
            'alternatives.match': 'Tags must be a string or array of strings',
        }),
    category: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Category cannot exceed 50 characters',
        }),
    ageRestriction: Joi.string()
        .optional()
        .valid('all', '18+')
        .default('all')
        .messages({
            'any.only': 'Age restriction must be either "all" or "18+"',
        }),
    isPublished: Joi.boolean()
        .optional()
        .default(false),
}).unknown(true); // Allow files from multer

export const updateVideoSchema = Joi.object({
    title: Joi.string()
        .optional()
        .trim()
        .min(3)
        .max(100)
        .messages({
            'string.min': 'Title must be at least 3 characters',
            'string.max': 'Title cannot exceed 100 characters',
        }),
    description: Joi.string()
        .optional()
        .trim()
        .min(10)
        .max(5000)
        .messages({
            'string.min': 'Description must be at least 10 characters',
            'string.max': 'Description cannot exceed 5000 characters',
        }),
    tags: Joi.alternatives()
        .try(
            Joi.string().trim().allow(''),
            Joi.array().items(Joi.string().trim())
        )
        .optional()
        .messages({
            'alternatives.match': 'Tags must be a string or array of strings',
        }),
    category: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Category cannot exceed 50 characters',
        }),
    ageRestriction: Joi.string()
        .optional()
        .valid('all', '18+')
        .messages({
            'any.only': 'Age restriction must be either "all" or "18+"',
        }),
});

export const getAllVideosSchema = Joi.object({
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
    sortBy: Joi.string()
        .optional()
        .valid('createdAt', 'views', 'likes', 'comments', 'title')
        .default('createdAt')
        .messages({
            'any.only': 'sortBy must be one of: createdAt, views, likes, comments, title',
        }),
    sortType: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'sortType must be either "asc" or "desc"',
        }),
    query: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Query cannot exceed 100 characters',
        }),
    userId: Joi.string()
        .optional()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'userId must be a valid MongoDB ObjectId',
        }),
});

export const getTrendingVideosSchema = Joi.object({
    category: Joi.string()
        .optional()
        .trim()
        .max(50)
        .messages({
            'string.max': 'Category cannot exceed 50 characters',
        }),
});

export const getVideoByIdSchema = Joi.object({
    id: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
            'any.required': 'Video ID is required',
        }),
});


export const videoIdParamSchema = Joi.object({
    id: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
            'any.required': 'Video ID is required',
        }),
});

export const getMyVideosSchema = Joi.object({
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
    sortBy: Joi.string()
        .optional()
        .valid('createdAt', 'views', 'likes', 'comments', 'title')
        .default('createdAt')
        .messages({
            'any.only': 'sortBy must be one of: createdAt, views, likes, comments, title',
        }),
    sortType: Joi.string()
        .optional()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
            'any.only': 'sortType must be either "asc" or "desc"',
        }),
    query: Joi.string()
        .optional()
        .trim()
        .max(100)
        .messages({
            'string.max': 'Query cannot exceed 100 characters',
        }),
});

export const getRecommendedVideosSchema = Joi.object({
    page: Joi.number()
        .optional()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Page must be at least 1',
        }),
    limit: Joi.alternatives()
        .try(
            Joi.number().integer().min(1).max(100),
            Joi.string().valid('all')
        )
        .optional()
        .default(10)
        .messages({
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
    category: Joi.string()
        .optional()
        .trim()
        .allow(null, '')
        .max(50)
        .messages({
            'string.max': 'Category cannot exceed 50 characters',
        }),
    allowRewatch: Joi.string()
        .optional()
        .valid('true', 'false')
        .default('false')
        .messages({
            'any.only': 'allowRewatch must be either "true" or "false"',
        }),
});

export const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
        const { error, value } = schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            const messages = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));
            return res.status(400).json({
                statusCode: 400,
                message: 'Validation failed',
                errors: messages,
            });
        }

        // Only reassign body (params and query are read-only in Express)
        // Ensure body is at least an empty object
        if (source === 'body') {
            req.body = value || {};
        }

        next();
    };
};

export default {
    postVideoSchema,
    updateVideoSchema,
    getAllVideosSchema,
    getTrendingVideosSchema,
    getVideoByIdSchema,
    videoIdParamSchema,
    getMyVideosSchema,
    getRecommendedVideosSchema,
    validateRequest,
};
