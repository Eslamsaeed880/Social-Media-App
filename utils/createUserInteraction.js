import UserInteraction from '../models/userInteraction.js';

export const createUserInteraction = async (userId, videoId, action) => {
    try {
        if (!userId || !videoId || !action) {
            console.warn('Missing required interaction data:', { userId, videoId, action });
            return null;
        }

        // Check if interaction already exists
        const existingInteraction = await UserInteraction.findOne({
            userId,
            videoId,
            action
        }).lean();

        if (existingInteraction) {
            console.log('Interaction already exists, skipping:', { userId, videoId, action });
            return null;
        }

        // Create new interaction (pre-save hook will update user interests)
        const interaction = new UserInteraction({
            userId,
            videoId,
            action
        });

        await interaction.save();
        console.log('User interaction created successfully:', { userId, videoId, action });
        return interaction;
    } catch (error) {
        console.error('Error creating user interaction:', error);
        throw error;
    }
};

export default createUserInteraction;
