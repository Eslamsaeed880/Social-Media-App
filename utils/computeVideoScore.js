export const computeVideoScore = (video) => {
    const engagementScore = 
        video.likes * 3 +
        video.comments * 5 + 
        video.views * 0.1;
    
    const hoursSinceVideoPublished = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
    const timeDecay = hoursSinceVideoPublished + 2;

    return engagementScore / timeDecay;
}