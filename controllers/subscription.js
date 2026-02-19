import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Subscription from "../models/subscription.js";
import User from "../models/user.js";

// @Desc: Subscribe to a channel
// Route: POST /api/v1/subscriptions
// Access: Private
export const subscribeToChannel = async (req, res, next) => {
    try {
        const { channelId, notificationsEnabled } = req.body;
        const { user } = req;

        const notifications = notificationsEnabled !== undefined ? notificationsEnabled : true

        if (!channelId) {
            return next(new APIError(400, 'Channel ID is required'));
        }

        if (channelId === user.id) {
            return next(new APIError(400, 'You cannot subscribe to yourself'));
        }

        const channel = await User.findById(channelId);

        if (!channel) {
            return next(new APIError(404, 'Channel not found'));
        }

        const existingSubscription = await Subscription.findOne({ subscriberId: user.id, channelId });

        if (existingSubscription) {
            return next(new APIError(400, 'You are already subscribed to this channel'));
        }

        const subscription = new Subscription({
            subscriberId: user.id,
            channelId,
            notificationsEnabled: notifications
        });

        channel.numberOfSubscribers++;

        await channel.save();
        await subscription.save();

        return res.status(201).json(new APIResponse(201, 'Successfully subscribed to channel', subscription));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Unsubscribe from a channel
// Route: DELETE /api/v1/subscriptions
// Access: Private
export const unsubscribeFromChannel = async (req, res, next) => {
    try {
        const { channelId } = req.body;
        const { user } = req;

        if (!channelId) {
            return next(new APIError(400, 'Channel ID is required'));
        }

        const subscription = await Subscription.findOne({ subscriberId: user.id, channelId });

        if (!subscription) {
            return next(new APIError(404, 'Subscription not found'));
        }
        
        await subscription.deleteOne();

        const channel = await User.findById(channelId);
        channel.numberOfSubscribers--;
        await channel.save();

        return res.status(200).json(new APIResponse(200, 'Successfully unsubscribed from channel'));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Toggle notifications for a channel
// Route: PATCH /api/v1/subscriptions/notifications
// Access: Private
export const toggleNotifications = async (req, res, next) => {
    try {
        const { channelId } = req.body;
        const { user } = req;
        
        if (!channelId) {
            return next(new APIError(400, 'Channel ID is required'));
        }

        const subscription = await Subscription.findOne({ subscriberId: user.id, channelId });

        if (!subscription) {
            return next(new APIError(404, 'Subscription not found'));
        }

        subscription.notificationsEnabled = !subscription.notificationsEnabled;
        await subscription.save();

        return res.status(200).json(new APIResponse(200, 'Notifications toggled successfully', subscription));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all subscriptions of a user
// Route: GET /api/v1/subscriptions
// Access: Private
export const getUserSubscriptions = async (req, res, next) => {
    try {
        const { user } = req;
        const { page = 1, limit = 10 } = req.query;

        const skip = (+page - 1) * +limit;

        const [subscriptions, totalSubscriptions] = await Promise.all([
            Subscription.find({ subscriberId: user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(+limit)
                .populate('channelId', 'username profilePicture'),
            Subscription.countDocuments({ subscriberId: user.id })
        ]);

        return res.status(200).json(new APIResponse(200, 'User subscriptions retrieved successfully', {
            subscriptions,
            totalSubscriptions,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSubscriptions / +limit),
        }));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}

// @Desc: Get all subscribers of a channel
// Route: GET /api/v1/subscriptions/subscribers
// Access: Private
export const getChannelSubscribers = async (req, res, next) => {
    try {
        const channelId = req.user.id;
        const { page = 1, limit = 10 } = req.query;

        if (!channelId) {
            return next(new APIError(400, 'Channel ID is required'));
        }

        const skip = (+page - 1) * +limit;

        const [subscriptions, totalSubscribers] = await Promise.all([
            Subscription.find({ channelId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(+limit)
                .populate('subscriberId', 'username profilePicture'),
            Subscription.countDocuments({ channelId })
        ]);

        return res.status(200).json(new APIResponse(200, 'Channel subscribers retrieved successfully', {
            subscribers: subscriptions,
            totalSubscribers,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalSubscribers / +limit),
        }));

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}