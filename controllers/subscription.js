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