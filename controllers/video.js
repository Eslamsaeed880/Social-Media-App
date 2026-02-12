import mongoose from "mongoose";
import APIError from "../utils/APIError.js";
import APIResponse from "../utils/APIResponse.js";
import Video from "../models/video.js";
import User from "../models/user.js";

// @Desc: Get all videos with filtering, sorting, and pagination
// @route  GET /api/v1/videos?page=1&limit=10&query=tutorials&sortedBy=views&sortType=desc&userId=1ef2d3c4b5a6f7g8h9i0j
// @Access Public
export const getAllVideos = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortType = 'desc', userId, query } = req.query;

        let pipeline = [];

        if(userId) {
            pipeline.push({
                $match: { owner: new mongoose.Types.ObjectId(userId) 
                },
            });
        }

        if(query) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } },
                        { tags : { $regex: query, $options: "i" } },
                        
                    ],
                },
            });
        }

        pipeline.push({
            $match: { isPublic: true }
        });

        pipeline.push(
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1,
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: { $first: "$owner"}
                }
            }
        );

        if(sortBy && sortType) {
            pipeline.push({
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1,
                },
            });
        }

        const totalResults = await Video.countDocuments(
            pipeline.length > 0 ? pipeline[0].$match : {}
        );

        console.log(page);

        pipeline.push(
            {
                $skip: (+page - 1) * +limit,
            },
            {
                $limit: +limit,
            }
        );

        const videos = await Video.aggregate(pipeline);

        return res.status(200).json(
            new APIResponse(
                200,
                {
                    videos,
                    totalResults,
                    currentPage: +page,
                    totalPages: Math.ceil(totalResults / +limit),
                },
                "Videos fetched successfully"
            )
        );

    } catch (error) {
        console.error(error);
        return next(new APIError(500, 'Server error'));
    }
}