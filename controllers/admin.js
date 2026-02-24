import Report from "../models/report.js";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import User from "../models/user.js";
import Video from "../models/video.js";
import Comment from "../models/comment.js";
import { invalidateCacheByPrefixes } from "../utils/redisCache.js";

const REPORT_CACHE_PREFIX = 'reports';
const USER_CACHE_PREFIX = 'users';
const VIDEO_CACHE_PREFIX = 'videos';
const COMMENT_CACHE_PREFIX = 'comments';
const ADMIN_CACHE_PREFIX = 'admin';

const invalidateAdminCache = (scope) => {
    invalidateCacheByPrefixes([`${ADMIN_CACHE_PREFIX}:${scope}:`]);
}

// @Desc: Get all reports (admin only)
// @Route: GET /api/v1/admin/reports?page=1&limit=10&status=pending  
// @Access: Private (admin)
export const getAllReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const reports = await Report.find(status ? { status } : {})
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email')
            .populate('videoId', 'title')
            .populate('commentId', 'content')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit);

        const totalResults = await Report.countDocuments(status ? { status } : {});

        return res.status(200).json(new APIResponse(200, { 
            reports,
            currentPage: +page, 
            totalResults, 
            totalPages: Math.ceil(totalResults / +limit) 
        }, 'Reports retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Update report status (admin only)
// @Route: PUT /api/v1/admin/reports/:reportId
// @Access: Private (admin)
export const updateReportStatus = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const { status, reviewNotes } = req.body;

        if (!['pending', 'reviewed', 'resolved'].includes(status)) {
            return next(new APIError(400, 'Invalid status value'));
        }

        const report = await Report.findById(reportId);

        if (!report) {
            return next(new APIError(404, 'Report not found'));
        }

        report.status = status;
        report.reviewNotes = reviewNotes || report.reviewNotes;

        await report.save();
        await invalidateAdminCache('reports');

        return res.status(200).json(new APIResponse(200, report, 'Report status updated successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get one report by ID (admin only)
// @Route: GET /api/v1/admin/reports/:reportId
// @Access: Private (admin)
export const getReportById = async (req, res, next) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findById(reportId)
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email')
            .populate('videoId', 'title')
            .populate('commentId', 'content');

        if (!report) {
            return next(new APIError(404, 'Report not found'));
        }

        return res.status(200).json(new APIResponse(200, report, 'Report retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all users (admin only)
// @Route: GET /api/v1/admin/users?page=1&limit=10&search=keyword&sort=createdAt|username|email&order=asc|desc
// @Access: Private (admin)
export const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, sort = 'createdAt', order = 'desc' } = req.query;

        const query = search ? { $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ]} : {};

        const sortField = sort === 'username' ? 'username' : sort === 'email' ? 'email' : sort;
        const sortOrder = order === 'desc' ? -1 : 1;

        const users = await User.find(query)
            .select('-password')
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(+limit);

        const totalResults = await User.countDocuments(query);

        return res.status(200).json(new APIResponse(200, { 
            users,
            currentPage: +page,
            totalResults,
            totalPages: Math.ceil(totalResults / +limit)
        }, 'Users retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get one user by ID (admin only)
// @Route: GET /api/v1/admin/users/:userId
// @Access: Private (admin)
export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return next(new APIError(404, 'User not found'));
        }

        return res.status(200).json(new APIResponse(200, { 
            user
        }, 'User retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Delete a user (admin only)
// @Route: DELETE /api/v1/admin/users/:userId
// @Access: Private (admin)
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return next(new APIError(404, 'User not found'));
        }

        await user.deleteOne();

        await invalidateAdminCache('users');

        return res.status(200).json(new APIResponse(200, {}, 'User deleted successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get videos by user ID (admin only)
// @Route: GET /api/v1/admin/users/:userId/videos?page=1&limit=10
// @Access: Private (admin)
export const getVideosByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const videos = await Video.find({ publisherId: userId })
            .select('-videoFile')
            .skip((page - 1) * limit)
            .limit(+limit)
            .sort({ createdAt: -1 });

        const totalResults = await Video.countDocuments({ publisherId: userId });

        return res.status(200).json(new APIResponse(200, { 
            videos,
            currentPage: +page,
            totalResults,
            totalPages: Math.ceil(totalResults / +limit)
        }, 'Videos retrieved successfully'));
        
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get comments by user ID (admin only)
// @Route: GET /api/v1/admin/users/:userId/comments?page=1&limit=10
// @Access: Private (admin)
export const getCommentsByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const comments = await Comment.find({ createdBy: userId })
            .skip((page - 1) * limit)
            .limit(+limit)
            .sort({ createdAt: -1 });

        const totalResults = await Comment.countDocuments({ createdBy: userId });

        return res.status(200).json(new APIResponse(200, { 
            comments,
            currentPage: +page,
            totalResults,
            totalPages: Math.ceil(totalResults / +limit)
        }, 'Comments retrieved successfully'));
        
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Geet all videos (admin only)
// @Route: GET /api/v1/admin/videos?page=1&limit=10&search=keyword&sort=createdAt|title&order=asc|desc
// @Access: Private (admin)
export const getAllVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, sort = 'createdAt', order = 'desc' } = req.query;

        const query = search ? { title: { $regex: search, $options: 'i' } } : {};

        const sortField = sort === 'title' ? 'title' : sort;
        const sortOrder = order === 'desc' ? -1 : 1;

        const videos = await Video.find(query)
            .select('-videoFile -description -tags -duration')
            .sort({ [sortField]: sortOrder })
            .skip((page - 1) * limit)
            .limit(+limit);

        const totalResults = await Video.countDocuments(query);

        return res.status(200).json(new APIResponse(200, { 
            videos,
            currentPage: +page,
            totalResults,
            totalPages: Math.ceil(totalResults / +limit)
        }, 'Videos retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get video by ID (admin only)
// @Route: GET /api/v1/admin/videos/:videoId
// @Access: Private (admin)
export const getVideoById = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        
        const video = await Video.findById(videoId)
            .populate('publisherId', 'username email');

        return res.status(200).json(new APIResponse(200, video, 'Video retrieved successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Delete a video (admin only)
// @Route: DELETE /api/v1/admin/videos/:videoId
// @Access: Private (admin)
export const deleteVideo = async (req, res, next) => {
    try {
        const { videoId } = req.params;

        const video = await Video.findById(videoId);

        if (!video) {
            return next(new APIError(404, 'Video not found'));
        }

        await video.deleteOne();

        await invalidateAdminCache('videos');

        return res.status(200).json(new APIResponse(200, {}, 'Video deleted successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all comments (admin only)
// @Route: GET /api/v1/admin/comments?page=1&limit=10&search=keyword&sort=createdAt&order=asc|desc
// @Access: Private (admin)
export const getAllComments = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, sort = 'createdAt', order = 'desc' } = req.query;

        const query = search ? { content: { $regex: search, $options: 'i' } } : {};

        const sortOrder = order === 'desc' ? -1 : 1;

        const comments = await Comment.find(query)
            .populate('createdBy', 'username email')
            .populate('videoId', 'title')
            .select('-replies')
            .sort({ [sort]: sortOrder })
            .skip((page - 1) * limit)
            .limit(+limit);

        const totalResults = await Comment.countDocuments(query);

        return res.status(200).json(new APIResponse(200, { 
            comments,
            currentPage: +page,
            totalResults,
            totalPages: Math.ceil(totalResults / +limit)
        }, 'Comments retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// Desc: Get comment by ID (admin only)
// Route: GET /api/v1/admin/comments/:commentId
// Access: Private (admin)
export const getCommentById = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId)
            .populate('createdBy', 'username email')
            .populate('videoId', 'title');

        if (!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        return res.status(200).json(new APIResponse(200, comment, 'Comment retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Delete a comment (admin only)
// @Route: DELETE /api/v1/admin/comments/:commentId
// @Access: Private (admin)
export const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return next(new APIError(404, 'Comment not found'));
        }

        await comment.deleteOne();

        await invalidateAdminCache('comments');

        return res.status(200).json(new APIResponse(200, {}, 'Comment deleted successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}