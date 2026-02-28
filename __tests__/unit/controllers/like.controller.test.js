import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const likeSaveMock = jest.fn();

const LikeMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: 'like-1',
    save: likeSaveMock,
}));

LikeMock.findOne = jest.fn();

const VideoMock = {
    findById: jest.fn(),
};

const CommentMock = {
    findById: jest.fn(),
};

const UserMock = {
    findById: jest.fn(),
};

const enqueueNotificationEventMock = jest.fn();
const enqueueAnalyticsEventMock = jest.fn();

await jest.unstable_mockModule('../../../models/like.js', () => ({
    default: LikeMock,
}));

await jest.unstable_mockModule('../../../models/video.js', () => ({
    default: VideoMock,
}));

await jest.unstable_mockModule('../../../models/comment.js', () => ({
    default: CommentMock,
}));

await jest.unstable_mockModule('../../../models/user.js', () => ({
    default: UserMock,
}));

await jest.unstable_mockModule('../../../queues/notificationsQueue.js', () => ({
    enqueueNotificationEvent: enqueueNotificationEventMock,
}));

await jest.unstable_mockModule('../../../queues/analyticsQueue.js', () => ({
    enqueueAnalyticsEvent: enqueueAnalyticsEventMock,
}));

const { likeVideo, unlikeVideo, likeComment, unlikeComment } = await import('../../../controllers/like.js');

describe('Like Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('likeVideo returns 404 when video is missing', async () => {
        VideoMock.findById.mockResolvedValueOnce(null);

        const req = {
            body: { videoId: 'missing-video' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await likeVideo(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/video not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('likeVideo returns 400 when already liked', async () => {
        VideoMock.findById.mockResolvedValueOnce({ _id: 'video-1' });
        LikeMock.findOne.mockResolvedValueOnce({ _id: 'like-existing' });

        const req = {
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await likeVideo(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(400);
        expect(errorArg.message).toMatch(/already liked/i);
    });

    it('likeVideo creates like and returns 201', async () => {
        const videoDoc = {
            _id: 'video-1',
            title: 'Demo',
            publisherId: 'channel-1',
            likes: 2,
            save: jest.fn().mockResolvedValueOnce(),
        };
        VideoMock.findById.mockResolvedValueOnce(videoDoc);
        LikeMock.findOne.mockResolvedValueOnce(null);
        UserMock.findById.mockResolvedValueOnce({ username: 'alice' });
        likeSaveMock.mockResolvedValueOnce();
        enqueueNotificationEventMock.mockResolvedValueOnce();
        enqueueAnalyticsEventMock.mockResolvedValueOnce();

        const req = {
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await likeVideo(req, res, next);

        expect(LikeMock).toHaveBeenCalledWith({ likedBy: 'user-1', videoId: 'video-1' });
        expect(likeSaveMock).toHaveBeenCalledTimes(1);
        expect(videoDoc.likes).toBe(3);
        expect(videoDoc.save).toHaveBeenCalledTimes(1);
        expect(enqueueNotificationEventMock).toHaveBeenCalledTimes(1);
        expect(enqueueAnalyticsEventMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('unlikeVideo returns 400 when no like exists', async () => {
        VideoMock.findById.mockResolvedValueOnce({ _id: 'video-1' });
        LikeMock.findOne.mockResolvedValueOnce(null);

        const req = {
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await unlikeVideo(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(400);
        expect(errorArg.message).toMatch(/have not liked/i);
    });

    it('likeComment creates like and returns 201', async () => {
        const commentDoc = {
            _id: 'comment-1',
            createdBy: 'author-1',
            content: 'hello',
            likes: 0,
            save: jest.fn().mockResolvedValueOnce(),
        };
        CommentMock.findById.mockResolvedValueOnce(commentDoc);
        LikeMock.findOne.mockResolvedValueOnce(null);
        UserMock.findById.mockResolvedValueOnce({ username: 'alice' });
        likeSaveMock.mockResolvedValueOnce();
        enqueueNotificationEventMock.mockResolvedValueOnce();

        const req = {
            body: { commentId: 'comment-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await likeComment(req, res, next);

        expect(LikeMock).toHaveBeenCalledWith({ likedBy: 'user-1', commentId: 'comment-1' });
        expect(commentDoc.likes).toBe(1);
        expect(commentDoc.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('unlikeComment returns 404 when comment is missing', async () => {
        CommentMock.findById.mockResolvedValueOnce(null);

        const req = {
            body: { commentId: 'missing-comment' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await unlikeComment(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/comment not found/i);
    });
});