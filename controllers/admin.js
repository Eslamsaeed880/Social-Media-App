import Report from "../models/report.js";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import User from "../models/user.js";

// @Desc: Get all reports (admin only)
// @Route: GET /api/v1/admin/reports?page=1&limit=10&status=pending  
// @Access: Private (admin)
export const getAllReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        if (req.user.role !== 'admin') {
            return next(new APIError(403, 'Access denied'));
        }

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

        if (req.user.role !== 'admin') {
            return next(new APIError(403, 'Access denied'));
        }

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

        if (req.user.role !== 'admin') {
            return next(new APIError(403, 'Access denied'));
        }

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