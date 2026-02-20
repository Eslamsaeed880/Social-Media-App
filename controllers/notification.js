import APIError from '../utils/APIError.js';
import APIResponse from '../utils/APIResponse.js';
import Notification from '../models/notification.js';
import User from '../models/user.js';
import mongoose from 'mongoose';

// @Desc: Get notifications for the authenticated user with pagination
// Route: GET /api/v1/notifications
// Access: Private
export const getNotifications = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false } = req.query;
        const { user } = req;

        const matchStage = {
            recipient: new mongoose.Types.ObjectId(user.id),
        };

        if (unreadOnly === "true") {
            matchStage.read = false;
        }

        const notifications = await Notification.aggregate([
            {
                $match: matchStage,
            },
            {
                $lookup: {
                    from: "Users",
                    localField: "sender",
                    foreignField: "_id",
                    as: "sender",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            },
                        },
                    ],
                },
            },
            {
                $addFields: {
                    sender: { $first: "$sender" },
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $skip: (+page - 1) * +limit,
            },
            {
                $limit: +limit,
            },
        ]);
    
        const unreadCount = await Notification.countDocuments({
            recipient: user.id,
            isRead: false,
        });

        const totalCount = await Notification.countDocuments({
            recipient: user.id,
        });

        return res.status(200).json(
            new APIResponse(
            200,
            {
                notifications,
                unreadCount,
                totalCount,
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / Number(limit)),
            },
            "Notifications fetched successfully"
            )
        );

    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}   

// @Desc: Mark a notification as read
// Route: PATCH /api/v1/notifications/:id/read
// Access: Private
export const markAllAsRead = async (req, res, next) => {
    try {
        const { user } = req;
        
        const notifications = await Notification.updateMany(
            { recipient: user.id, isRead: false },
            { $set: { isRead: true } }
        )

        return res.status(200).json(new APIResponse(200, notifications, 'All notifications marked as read'));
    } catch (error) {
        console.log(error);
        return next(new APIError(500, 'Server error'));
    }
}