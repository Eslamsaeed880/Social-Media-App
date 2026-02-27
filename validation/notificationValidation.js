import Joi from 'joi';

/**
 * Notification ID Param Validation
 * PATCH /api/v1/notifications/read/:notificationId
 * DELETE /api/v1/notifications/:notificationId
 */
export const notificationIdParamSchema = Joi.object({
    notificationId: Joi.string()
        .required()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.empty': 'Notification ID is required',
            'string.pattern.base': 'Notification ID must be a valid MongoDB ObjectId',
            'any.required': 'Notification ID is required',
        }),
});

/**
 * Notifications Query Validation
 * GET /api/v1/notifications
 */
export const notificationsQuerySchema = Joi.object({
    page: Joi.number()
        .optional()
        .integer()
        .min(1)
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
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
    unreadOnly: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'unreadOnly must be a boolean',
        }),
});

export default {
    notificationIdParamSchema,
    notificationsQuerySchema,
};
