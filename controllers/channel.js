import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import ChannelAnalytics from '../models/channelAnalytics.js';

// @Desc: Get channel analytics
// Route: GET /api/v1/channels/analytics
// Access: Private (only channel owner)
export const getChannelAnalytics = async (req, res, next) => {
    try {
        const { user } = req;

        let analytics = await ChannelAnalytics.findOne({ channelId: user.id });

        if (!analytics) {
            analytics = new ChannelAnalytics({ channelId: user.id });
            await analytics.save();
        }

        return res.status(200).json(new APIResponse(200, 'Channel analytics retrieved successfully', analytics));
    } catch (error) {
        console.error('Error fetching channel analytics:', error);
        return next(new APIError(500, 'Server error'));
    }
}