import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Report from "../models/report.js";
import { invalidateCacheByPrefixes } from "../utils/redisCache.js";

// @Desc: Report a video, comment, or user
// @Route: POST /api/v1/reports
// @Access: Private
export const reportContent = async (req, res, next) => {
    try {
        const { reason, description, videoId, commentId, reportedUserId } = req.body;

        const report = new Report({
            reportedBy: req.user.id,
            reason,
            description,
            videoId,
            commentId,
            reportedUser: reportedUserId
        });

        await report.save();

        await invalidateCacheByPrefixes([`reports:all:${req.user.id}:`]);

        return res.status(201).json(new APIResponse(201, report, 'Content reported successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all reports for a specific user
// @Route: GET /api/v1/reports?page=1&limit=10
// @Access: Private
export const getUserReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { user } = req;

        const reports = await Report.find({ reportedBy: user.id })
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const totalReports = await Report.countDocuments({ reportedBy: user.id });

        return res.status(200).json(new APIResponse(200, { reports, totalReports, page, limit }, 'User reports retrieved successfully'));
    
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get a report by ID
// @Route: GET /api/v1/reports/:reportId
// @Access: Private
export const getReportById = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const { user } = req;

        const report = await Report.findOne({ _id: reportId, reportedBy: user.id })
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email');

        if (!report) {
            return next(new APIError(404, 'Report not found'));
        }

        return res.status(200).json(new APIResponse(200, report, 'Report retrieved successfully'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}