import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Report from "../models/report.js";

// @Desc: Report a video, comment, or user
// @Route: POST /api/v1/reports
// @Access: Private
export const reportContent = async (req, res, next) => {
    try {
        const { reason, description, videoId, commentId, reportedUserId } = req.body;

        if (!reason || !description) {
            return next(new APIError(400, 'Reason and description are required'));
        }

        if (!videoId && !commentId && !reportedUserId) {
            return next(new APIError(400, 'one of videoId, commentId, or reportedUserId must be provided'));
        }

        if((videoId && commentId) || (videoId && reportedUserId) || (commentId && reportedUserId)) {
            return next(new APIError(400, 'You should specify only one of videoId, commentId, or reportedUserId to report'));
        }

        const report = new Report({
            reportedBy: req.user.id,
            reason,
            description,
            videoId,
            commentId,
            reportedUser: reportedUserId
        });

        await report.save();

        return res.status(201).json(new APIResponse(201, report, 'Content reported successfully'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}