import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const watchLaterSaveMock = jest.fn();

const WatchLaterMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: data._id || 'watchlater-1',
    save: watchLaterSaveMock,
}));

WatchLaterMock.findOne = jest.fn();
WatchLaterMock.find = jest.fn();
WatchLaterMock.deleteOne = jest.fn();

const VideoMock = {
    findOne: jest.fn(),
};

const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/watchLater.js', () => ({
    default: WatchLaterMock,
}));

await jest.unstable_mockModule('../../../models/video.js', () => ({
    default: VideoMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const {
    addToWatchLater,
    getWatchLaterList,
    removeFromWatchLater,
} = await import('../../../controllers/watchLater.js');

describe('Watch Later Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('addToWatchLater returns 404 when video does not exist or unpublished', async () => {
        VideoMock.findOne.mockResolvedValueOnce(null);

        const req = {
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await addToWatchLater(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/video not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('addToWatchLater creates entry and returns 201', async () => {
        VideoMock.findOne.mockResolvedValueOnce({ _id: 'video-1', isPublished: true });
        WatchLaterMock.findOne.mockResolvedValueOnce(null);
        watchLaterSaveMock.mockResolvedValueOnce();
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await addToWatchLater(req, res, next);

        expect(WatchLaterMock).toHaveBeenCalledWith({ userId: 'user-1', videoId: 'video-1' });
        expect(watchLaterSaveMock).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['watch-later:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('getWatchLaterList returns populated list', async () => {
        const list = [{ _id: 'watchlater-1', videoId: { _id: 'video-1' } }];
        WatchLaterMock.find.mockReturnValueOnce({
            populate: jest.fn().mockResolvedValueOnce(list),
        });

        const req = { user: { id: 'user-1' } };
        const res = createRes();
        const next = jest.fn();

        await getWatchLaterList(req, res, next);

        expect(WatchLaterMock.find).toHaveBeenCalledWith({ userId: 'user-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.data).toEqual(list);
        expect(next).not.toHaveBeenCalled();
    });

    it('removeFromWatchLater deletes existing entry and returns 200', async () => {
        WatchLaterMock.findOne.mockResolvedValueOnce({ _id: 'watchlater-1' });
        WatchLaterMock.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            params: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await removeFromWatchLater(req, res, next);

        expect(WatchLaterMock.deleteOne).toHaveBeenCalledWith({ _id: 'watchlater-1' });
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['watch-later:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});