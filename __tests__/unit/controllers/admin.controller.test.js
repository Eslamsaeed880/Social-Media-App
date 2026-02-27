import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';
import { createListQueryChain, createPopulateChain } from '../utils/queryTestUtils.js';

const ReportMock = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
};

const UserMock = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
};

const VideoMock = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
};

const CommentMock = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
};

const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/report.js', () => ({
    default: ReportMock,
}));

await jest.unstable_mockModule('../../../models/user.js', () => ({
    default: UserMock,
}));

await jest.unstable_mockModule('../../../models/video.js', () => ({
    default: VideoMock,
}));

await jest.unstable_mockModule('../../../models/comment.js', () => ({
    default: CommentMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const {
    getAllReports,
    updateReportStatus,
    getReportById,
    getAllUsers,
    getUserById,
    deleteUser,
    getVideosByUserId,
    getCommentsByUserId,
    getAllVideos,
    getVideoById,
    deleteVideo,
    getAllComments,
    getCommentById,
    deleteComment,
} = await import('../../../controllers/admin.js');

describe('Admin Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getAllReports returns paginated reports', async () => {
        const reports = [{ _id: 'report-1' }];
        const reportQuery = createListQueryChain(reports);
        ReportMock.find.mockReturnValueOnce(reportQuery);
        ReportMock.countDocuments.mockResolvedValueOnce(1);

        const req = { query: { page: 1, limit: 10, status: 'pending' } };
        const res = createRes();
        const next = jest.fn();

        await getAllReports(req, res, next);

        expect(ReportMock.find).toHaveBeenCalledWith({ status: 'pending' });
        expect(ReportMock.countDocuments).toHaveBeenCalledWith({ status: 'pending' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(next).not.toHaveBeenCalled();
    });

    it('updateReportStatus returns 404 when report is not found', async () => {
        ReportMock.findById.mockResolvedValueOnce(null);

        const req = {
            params: { reportId: 'missing-report' },
            body: { status: 'resolved' },
        };
        const res = createRes();
        const next = jest.fn();

        await updateReportStatus(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/report not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('updateReportStatus updates report and invalidates related cache keys', async () => {
        const reportDoc = {
            _id: 'report-1',
            reportedBy: 'user-1',
            reviewNotes: 'old notes',
            save: jest.fn().mockResolvedValueOnce(),
        };
        ReportMock.findById.mockResolvedValueOnce(reportDoc);

        const req = {
            params: { reportId: 'report-1' },
            body: { status: 'resolved', reviewNotes: 'checked' },
        };
        const res = createRes();
        const next = jest.fn();

        await updateReportStatus(req, res, next);

        expect(reportDoc.status).toBe('resolved');
        expect(reportDoc.reviewNotes).toBe('checked');
        expect(reportDoc.save).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith([
            'reports:all:user-1:',
            'reports:report:report-1:user-1:',
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getReportById returns report details', async () => {
        const report = { _id: 'report-1' };
        ReportMock.findById.mockReturnValueOnce(createPopulateChain(report, 4));

        const req = { params: { reportId: 'report-1' } };
        const res = createRes();
        const next = jest.fn();

        await getReportById(req, res, next);

        expect(ReportMock.findById).toHaveBeenCalledWith('report-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getAllUsers returns paginated users list', async () => {
        const users = [{ _id: 'user-1', username: 'admin-view' }];
        const userQuery = createListQueryChain(users);
        UserMock.find.mockReturnValueOnce(userQuery);
        UserMock.countDocuments.mockResolvedValueOnce(1);

        const req = { query: { page: 1, limit: 10, search: 'admin', sort: 'username', order: 'asc' } };
        const res = createRes();
        const next = jest.fn();

        await getAllUsers(req, res, next);

        expect(UserMock.find).toHaveBeenCalledWith({
            $or: [
                { username: { $regex: 'admin', $options: 'i' } },
                { email: { $regex: 'admin', $options: 'i' } },
            ],
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getUserById returns 404 when user is not found', async () => {
        UserMock.findById.mockReturnValueOnce({
            select: jest.fn().mockResolvedValueOnce(null),
        });

        const req = { params: { userId: 'missing-user' } };
        const res = createRes();
        const next = jest.fn();

        await getUserById(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/user not found/i);
    });

    it('deleteUser deletes a user and invalidates related cache keys', async () => {
        const userDoc = {
            username: 'jane',
            deleteOne: jest.fn().mockResolvedValueOnce(),
        };
        UserMock.findById.mockResolvedValueOnce(userDoc);

        const req = { params: { userId: 'user-1' } };
        const res = createRes();
        const next = jest.fn();

        await deleteUser(req, res, next);

        expect(userDoc.deleteOne).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith([
            'users:profile:jane:',
            'videos:',
        ]);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getVideosByUserId returns paginated videos by user', async () => {
        const videos = [{ _id: 'video-1' }];
        const videoQuery = createListQueryChain(videos, 'sort');
        VideoMock.find.mockReturnValueOnce(videoQuery);
        VideoMock.countDocuments.mockResolvedValueOnce(1);

        const req = { params: { userId: 'user-1' }, query: { page: 1, limit: 10 } };
        const res = createRes();
        const next = jest.fn();

        await getVideosByUserId(req, res, next);

        expect(VideoMock.find).toHaveBeenCalledWith({ publisherId: 'user-1' });
        expect(VideoMock.countDocuments).toHaveBeenCalledWith({ publisherId: 'user-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getCommentsByUserId returns paginated comments by user', async () => {
        const comments = [{ _id: 'comment-1' }];
        const commentQuery = createListQueryChain(comments, 'sort');
        CommentMock.find.mockReturnValueOnce(commentQuery);
        CommentMock.countDocuments.mockResolvedValueOnce(1);

        const req = { params: { userId: 'user-1' }, query: { page: 1, limit: 10 } };
        const res = createRes();
        const next = jest.fn();

        await getCommentsByUserId(req, res, next);

        expect(CommentMock.find).toHaveBeenCalledWith({ createdBy: 'user-1' });
        expect(CommentMock.countDocuments).toHaveBeenCalledWith({ createdBy: 'user-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getAllVideos returns paginated videos list', async () => {
        const videos = [{ _id: 'video-1', title: 'Demo' }];
        const videoQuery = createListQueryChain(videos);
        VideoMock.find.mockReturnValueOnce(videoQuery);
        VideoMock.countDocuments.mockResolvedValueOnce(1);

        const req = { query: { page: 1, limit: 10, search: 'Demo', sort: 'title', order: 'asc' } };
        const res = createRes();
        const next = jest.fn();

        await getAllVideos(req, res, next);

        expect(VideoMock.find).toHaveBeenCalledWith({ title: { $regex: 'Demo', $options: 'i' } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getVideoById returns a video', async () => {
        const video = { _id: 'video-1' };
        VideoMock.findById.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce(video),
        });

        const req = { params: { videoId: 'video-1' } };
        const res = createRes();
        const next = jest.fn();

        await getVideoById(req, res, next);

        expect(VideoMock.findById).toHaveBeenCalledWith('video-1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('deleteVideo returns 404 when video is not found', async () => {
        VideoMock.findById.mockResolvedValueOnce(null);

        const req = { params: { videoId: 'missing-video' } };
        const res = createRes();
        const next = jest.fn();

        await deleteVideo(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/video not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('getAllComments returns paginated comments list', async () => {
        const comments = [{ _id: 'comment-1' }];
        const commentQuery = createListQueryChain(comments);
        CommentMock.find.mockReturnValueOnce(commentQuery);
        CommentMock.countDocuments.mockResolvedValueOnce(1);

        const req = { query: { page: 1, limit: 10, search: 'hello', sort: 'createdAt', order: 'desc' } };
        const res = createRes();
        const next = jest.fn();

        await getAllComments(req, res, next);

        expect(CommentMock.find).toHaveBeenCalledWith({ content: { $regex: 'hello', $options: 'i' } });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getCommentById returns 404 when comment is not found', async () => {
        CommentMock.findById.mockReturnValueOnce(createPopulateChain(null, 2));

        const req = { params: { commentId: 'missing-comment' } };
        const res = createRes();
        const next = jest.fn();

        await getCommentById(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/comment not found/i);
    });

    it('deleteComment deletes a comment successfully', async () => {
        const commentDoc = {
            _id: 'comment-1',
            deleteOne: jest.fn().mockResolvedValueOnce(),
        };
        CommentMock.findById.mockResolvedValueOnce(commentDoc);

        const req = { params: { commentId: 'comment-1' } };
        const res = createRes();
        const next = jest.fn();

        await deleteComment(req, res, next);

        expect(commentDoc.deleteOne).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});
