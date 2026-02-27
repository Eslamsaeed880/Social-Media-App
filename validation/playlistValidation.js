import Joi from 'joi';

const objectIdRule = Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.empty': 'ID is required',
        'string.pattern.base': 'ID must be a valid MongoDB ObjectId',
        'any.required': 'ID is required',
    });

/**
 * Create Playlist Validation
 * POST /api/v1/playlists
 */
export const createPlaylistSchema = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Playlist name is required',
            'string.max': 'Playlist name cannot exceed 100 characters',
            'any.required': 'Playlist name is required',
        }),
    description: Joi.string()
        .optional()
        .allow('')
        .trim(),
    videoIds: Joi.array()
        .optional()
        .items(
            Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
                'string.pattern.base': 'Each video ID must be a valid MongoDB ObjectId',
            })
        ),
    isPublic: Joi.boolean().optional(),
    tags: Joi.array().optional().items(Joi.string().trim()),
});

/**
 * Update Playlist Validation
 * PUT /api/v1/playlists/:playlistId
 */
export const updatePlaylistSchema = Joi.object({
    name: Joi.string()
        .optional()
        .trim()
        .min(1)
        .max(100)
        .messages({
            'string.empty': 'Playlist name cannot be empty',
            'string.max': 'Playlist name cannot exceed 100 characters',
        }),
    description: Joi.string()
        .optional()
        .allow('')
        .trim(),
    isPublic: Joi.boolean().optional(),
    tags: Joi.array().optional().items(Joi.string().trim()),
}).min(1).messages({
    'object.min': 'At least one field is required to update playlist',
});

/**
 * Add Video to Playlist Validation
 * POST /api/v1/playlists/:playlistId/videos
 */
export const addVideoToPlaylistSchema = Joi.object({
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
 * Playlist ID Param Validation
 */
export const playlistIdParamSchema = Joi.object({
    playlistId: objectIdRule.messages({
        'string.empty': 'Playlist ID is required',
        'string.pattern.base': 'Playlist ID must be a valid MongoDB ObjectId',
        'any.required': 'Playlist ID is required',
    }),
});

/**
 * User ID Param Validation
 */
export const userIdParamSchema = Joi.object({
    userId: objectIdRule.messages({
        'string.empty': 'User ID is required',
        'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
        'any.required': 'User ID is required',
    }),
});

/**
 * Playlist and Video IDs Param Validation
 */
export const playlistAndVideoIdParamSchema = Joi.object({
    playlistId: objectIdRule.messages({
        'string.empty': 'Playlist ID is required',
        'string.pattern.base': 'Playlist ID must be a valid MongoDB ObjectId',
        'any.required': 'Playlist ID is required',
    }),
    videoId: objectIdRule.messages({
        'string.empty': 'Video ID is required',
        'string.pattern.base': 'Video ID must be a valid MongoDB ObjectId',
        'any.required': 'Video ID is required',
    }),
});

/**
 * Playlist Videos Query Validation
 * GET /api/v1/playlists/:playlistId/videos
 */
export const playlistVideosQuerySchema = Joi.object({
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

export default {
    createPlaylistSchema,
    updatePlaylistSchema,
    addVideoToPlaylistSchema,
    playlistIdParamSchema,
    userIdParamSchema,
    playlistAndVideoIdParamSchema,
    playlistVideosQuerySchema,
};
