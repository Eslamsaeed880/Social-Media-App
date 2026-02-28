import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const WatchHistoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
};

const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/watchHistory.js', () => ({
    default: WatchHistoryMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const { getWatchHistory, deleteWatchHistoryEntry, clearWatchHistory } = await import('../../../controllers/watchHistory.js');

const createWatchHistoryListChain = (resolvedValue) => {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValueOnce(resolvedValue),
    };
    return chain;
};

describe('Watch History Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getWatchHistory returns paginated history', async () => {
        const history = [{ _id: 'history-1' }];
        WatchHistoryMock.find.mockReturnValueOnce(createWatchHistoryListChain(history));
        WatchHistoryMock.countDocuments.mockResolvedValueOnce(1);

        const req = {
            query: { page: 1, limit: 10 },
            user: { _id: 'user-oid-1', id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await getWatchHistory(req, res, next);

        expect(WatchHistoryMock.find).toHaveBeenCalledWith({ user: 'user-oid-1' });
        expect(WatchHistoryMock.countDocuments).toHaveBeenCalledWith({ user: 'user-oid-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('deleteWatchHistoryEntry returns 404 when entry is missing', async () => {
        WatchHistoryMock.findOne.mockResolvedValueOnce(null);

        const req = {
            params: { historyId: 'missing-history' },
            user: { _id: 'user-oid-1', id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await deleteWatchHistoryEntry(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/watch history entry not found/i);
    });

    it('clearWatchHistory deletes user history and invalidates cache', async () => {
        WatchHistoryMock.deleteMany.mockResolvedValueOnce({ deletedCount: 3 });
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            user: { _id: 'user-oid-1', id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await clearWatchHistory(req, res, next);

        expect(WatchHistoryMock.deleteMany).toHaveBeenCalledWith({ user: 'user-oid-1' });
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['watch-history:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});