import { computeVideoScore } from "./computeVideoScore.js";
import UserInterest from "../models/userInterest.js";

export const computePersonalizedScore = async (userId, video) => {
    let score = computeVideoScore(video);
    const userInterest = await UserInterest.findOne({ userId });

    const category = video?.category?.toLowerCase?.();
    if (userInterest && category && userInterest.interests?.has(category)) {
        score += userInterest.interests.get(category) * 2;
    }

    return score;
};

export default computePersonalizedScore;