import Report from "../models/report.js";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import User from "../models/user.js";

// @Desc: Get all reports (admin only)
// @Route: GET /api/v1/admin/reports?page=1&limit=10    
// @Access: Private (admin)
export const getAllReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        if (req.user.role !== 'admin') {
            return next(new APIError(403, 'Access denied'));
        }

        const reports = await Report.find()
            .populate('reportedBy', 'username email')
            .populate('reportedUser', 'username email')
            .populate('videoId', 'title')
            .populate('commentId', 'content')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(+limit);

        const totalResults = await Report.countDocuments();

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