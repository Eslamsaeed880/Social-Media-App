import WatchHistory from '../models/watchHistory.js';

export const addToWatchHistory = async (userId, videoId) => {
    try {
        const existingEntry = await WatchHistory.findOne({ userId, videoId });

        if (existingEntry) {
            existingEntry.watchedAt = new Date();
            await existingEntry.save();
            return existingEntry;
        }

        const newEntry = new WatchHistory({ userId, videoId });
        await newEntry.save();
        return newEntry;
        
    } catch (error) {
        console.log(error);
        return null;
    }
}