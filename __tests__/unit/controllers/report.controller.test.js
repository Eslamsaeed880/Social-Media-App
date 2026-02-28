import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const reportSaveMock = jest.fn();

const ReportMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: data._id || 'report-1',
    save: reportSaveMock,
}));

ReportMock.find = jest.fn();
ReportMock.findOne = jest.fn();
ReportMock.countDocuments = jest.fn();

const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/report.js', () => ({
    default: ReportMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const { reportContent, getUserReports, getReportById } = await import('../../../controllers/report.js');

const createReportListChain = (resolvedValue) => {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce(resolvedValue),
    };
    return chain;
};

const createReportFindOneChain = (resolvedValue) => {
    const chain = {
        populate: jest.fn().mockReturnThis(),
    };

    chain.populate
        .mockReturnValueOnce(chain)
        .mockResolvedValueOnce(resolvedValue);

    return chain;
};

describe('Report Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reportContent creates report and invalidates user report cache', async () => {
        reportSaveMock.mockResolvedValueOnce();
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            body: {
                reason: 'spam',
                description: 'bad content',
                videoId: 'video-1',
            },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await reportContent(req, res, next);

        expect(ReportMock).toHaveBeenCalledWith({
            reportedBy: 'user-1',
            reason: 'spam',
            description: 'bad content',
            videoId: 'video-1',
            commentId: undefined,
            reportedUser: undefined,
        });
        expect(reportSaveMock).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['reports:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('getUserReports returns paginated list', async () => {
        const reports = [{ _id: 'report-1' }];
        ReportMock.find.mockReturnValueOnce(createReportListChain(reports));
        ReportMock.countDocuments.mockResolvedValueOnce(1);

        const req = {
            query: { page: 1, limit: 10 },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await getUserReports(req, res, next);

        expect(ReportMock.find).toHaveBeenCalledWith({ reportedBy: 'user-1' });
        expect(ReportMock.countDocuments).toHaveBeenCalledWith({ reportedBy: 'user-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getReportById returns 404 when report is not found', async () => {
        ReportMock.findOne.mockReturnValueOnce(createReportFindOneChain(null));

        const req = {
            params: { reportId: 'missing-report' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await getReportById(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/report not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });
});