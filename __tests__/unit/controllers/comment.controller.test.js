import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const commentSaveMock = jest.fn();
const commentDeleteMock = jest.fn();

const CommentMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: data._id || 'comment-1',
    replies: data.replies || [],
    save: commentSaveMock,
    deleteOne: commentDeleteMock,
}));

CommentMock.findById = jest.fn();
CommentMock.aggregate = jest.fn();
CommentMock.countDocuments = jest.fn();

const VideoMock = {
    findById: jest.fn(),
};

const UserMock = {
    findById: jest.fn(),
};

const enqueueNotificationEventMock = jest.fn();
const enqueueAnalyticsEventMock = jest.fn();

await jest.unstable_mockModule('../../../models/comment.js', () => ({
    default: CommentMock,
}));

await jest.unstable_mockModule('../../../models/video.js', () => ({
    default: VideoMock,
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

const { createComment, updateComment, deleteComment, getReplies, getCommentsOfVideo } = await import('../../../controllers/comment.js');

describe('Comment Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createComment returns 404 when video does not exist', async () => {
        VideoMock.findById.mockResolvedValueOnce(null);

        const req = {
            params: { videoId: 'missing-video' },
            body: { content: 'Nice video' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await createComment(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/video not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('createComment creates comment, updates video count, and returns 201', async () => {
        const videoDoc = {
            _id: 'video-1',
            title: 'Demo title',
            publisherId: 'channel-1',
            comments: 3,
            save: jest.fn().mockResolvedValueOnce(),
        };
        VideoMock.findById.mockResolvedValueOnce(videoDoc);
        UserMock.findById.mockResolvedValueOnce({ username: 'alice' });
        commentSaveMock.mockResolvedValueOnce();
        enqueueNotificationEventMock.mockResolvedValueOnce();
        enqueueAnalyticsEventMock.mockResolvedValueOnce();

        const req = {
            params: { videoId: 'video-1' },
            body: { content: 'Great one' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await createComment(req, res, next);

        expect(CommentMock).toHaveBeenCalledWith({
            content: 'Great one',
            videoId: 'video-1',
            createdBy: 'user-1',
        });
        expect(commentSaveMock).toHaveBeenCalledTimes(1);
        expect(videoDoc.comments).toBe(4);
        expect(videoDoc.save).toHaveBeenCalledTimes(1);
        expect(enqueueNotificationEventMock).toHaveBeenCalledTimes(1);
        expect(enqueueAnalyticsEventMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('updateComment returns 403 when user is not owner', async () => {
        CommentMock.findById.mockResolvedValueOnce({
            createdBy: { toString: () => 'owner-1' },
        });

        const req = {
            params: { commentId: 'comment-1' },
            body: { content: 'updated' },
            user: { id: 'user-2' },
        };
        const res = createRes();
        const next = jest.fn();

        await updateComment(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(403);
        expect(errorArg.message).toMatch(/not authorized/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('deleteComment deletes owned comment and returns 200', async () => {
        const commentDoc = {
            _id: 'comment-1',
            createdBy: { toString: () => 'user-1' },
            videoId: 'video-1',
            parentComment: null,
            deleteOne: jest.fn().mockResolvedValueOnce(),
        };
        CommentMock.findById.mockResolvedValueOnce(commentDoc);
        VideoMock.findById.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce({ publisherId: 'channel-1' }),
        });
        enqueueAnalyticsEventMock.mockResolvedValueOnce();

        const req = {
            params: { commentId: 'comment-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await deleteComment(req, res, next);

        expect(commentDoc.deleteOne).toHaveBeenCalledTimes(1);
        expect(enqueueAnalyticsEventMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getReplies returns 404 when parent comment is missing', async () => {
        CommentMock.findById.mockResolvedValueOnce(null);

        const req = {
            params: { commentId: '64c9f9a9f8a8c1d7b4c3a111' },
            query: { page: 1, limit: 10 },
        };
        const res = createRes();
        const next = jest.fn();

        await getReplies(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/comment not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('getReplies returns paginated replies in parent order', async () => {
        const replyId1 = '64c9f9a9f8a8c1d7b4c3a222';
        const replyId2 = '64c9f9a9f8a8c1d7b4c3a333';

        CommentMock.findById.mockResolvedValueOnce({
            replies: [replyId1, replyId2],
        });
        CommentMock.aggregate.mockResolvedValueOnce([
            { _id: replyId2, content: 'second' },
            { _id: replyId1, content: 'first' },
        ]);

        const req = {
            params: { commentId: '64c9f9a9f8a8c1d7b4c3a111' },
            query: { page: 1, limit: 10 },
        };
        const res = createRes();
        const next = jest.fn();

        await getReplies(req, res, next);

        expect(CommentMock.aggregate).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.data.replies).toHaveLength(2);
        expect(responsePayload.data.replies[0]._id).toBe(replyId1);
        expect(responsePayload.data.replies[1]._id).toBe(replyId2);
        expect(responsePayload.data.totalReplies).toBe(2);
        expect(next).not.toHaveBeenCalled();
    });

    it('getCommentsOfVideo returns comments list with pagination metadata', async () => {
        const videoId = '64c9f9a9f8a8c1d7b4c3a444';
        const comments = [{ _id: '64c9f9a9f8a8c1d7b4c3a555', content: 'hello' }];
        CommentMock.aggregate.mockResolvedValueOnce(comments);
        CommentMock.countDocuments.mockResolvedValueOnce(1);

        const req = {
            params: { videoId },
            query: { page: 1, limit: 10 },
        };
        const res = createRes();
        const next = jest.fn();

        await getCommentsOfVideo(req, res, next);

        expect(CommentMock.aggregate).toHaveBeenCalledTimes(1);
        expect(CommentMock.countDocuments).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.message.comments).toEqual(comments);
        expect(responsePayload.message.totalComments).toBe(1);
        expect(responsePayload.message.currentPage).toBe(1);
        expect(next).not.toHaveBeenCalled();
    });
});