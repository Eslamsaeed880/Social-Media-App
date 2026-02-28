import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const analyticsSaveMock = jest.fn();

const ChannelAnalyticsMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: data._id || 'analytics-1',
    save: analyticsSaveMock,
}));

ChannelAnalyticsMock.findOne = jest.fn();

await jest.unstable_mockModule('../../../models/channelAnalytics.js', () => ({
    default: ChannelAnalyticsMock,
}));

const { getChannelAnalytics } = await import('../../../controllers/channel.js');

describe('Channel Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns existing channel analytics', async () => {
        ChannelAnalyticsMock.findOne.mockResolvedValueOnce({ _id: 'analytics-1', channelId: 'user-1' });

        const req = { user: { id: 'user-1' } };
        const res = createRes();
        const next = jest.fn();

        await getChannelAnalytics(req, res, next);

        expect(ChannelAnalyticsMock.findOne).toHaveBeenCalledWith({ channelId: 'user-1' });
        expect(ChannelAnalyticsMock).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('creates analytics document when missing', async () => {
        ChannelAnalyticsMock.findOne.mockResolvedValueOnce(null);
        analyticsSaveMock.mockResolvedValueOnce();

        const req = { user: { id: 'user-1' } };
        const res = createRes();
        const next = jest.fn();

        await getChannelAnalytics(req, res, next);

        expect(ChannelAnalyticsMock).toHaveBeenCalledWith({ channelId: 'user-1' });
        expect(analyticsSaveMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});