import Joi from 'joi';

const objectIdRule = Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.empty': 'Channel ID is required',
        'string.pattern.base': 'Channel ID must be a valid MongoDB ObjectId',
        'any.required': 'Channel ID is required',
    });

/**
 * Subscribe Validation
 * POST /api/v1/subscriptions
 */
export const subscribeSchema = Joi.object({
    channelId: objectIdRule,
    notificationsEnabled: Joi.boolean().optional(),
});

/**
 * Unsubscribe Validation
 * DELETE /api/v1/subscriptions
 */
export const unsubscribeSchema = Joi.object({
    channelId: objectIdRule,
});

/**
 * Toggle Notifications Validation
 * PATCH /api/v1/subscriptions/notifications
 */
export const toggleNotificationsSchema = Joi.object({
    channelId: objectIdRule,
});

/**
 * Pagination Query Validation
 * GET /api/v1/subscriptions
 * GET /api/v1/subscriptions/subscribers
 */
export const subscriptionPaginationQuerySchema = Joi.object({
    page: Joi.number()
        .optional()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
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
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
});

export default {
    subscribeSchema,
    unsubscribeSchema,
    toggleNotificationsSchema,
    subscriptionPaginationQuerySchema,
};
