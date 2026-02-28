import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const subscriptionSaveMock = jest.fn();

const SubscriptionMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: 'sub-1',
    save: subscriptionSaveMock,
}));

SubscriptionMock.findOne = jest.fn();
SubscriptionMock.find = jest.fn();
SubscriptionMock.countDocuments = jest.fn();

const UserMock = {
    findById: jest.fn(),
};

const enqueueNotificationEventMock = jest.fn();
const enqueueAnalyticsEventMock = jest.fn();
const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/subscription.js', () => ({
    default: SubscriptionMock,
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

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const {
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleNotifications,
    getUserSubscriptions,
    getChannelSubscribers,
} = await import('../../../controllers/subscription.js');

const createSubscriptionListQueryChain = (resolvedValue) => {
    const chain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValueOnce(resolvedValue),
    };

    return chain;
};

describe('Subscription Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('subscribeToChannel returns 400 when channel id is missing', async () => {
        const req = {
            body: {},
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await subscribeToChannel(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(400);
        expect(errorArg.message).toMatch(/channel id is required/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('subscribeToChannel creates subscription and returns 201', async () => {
        const channelDoc = {
            _id: 'channel-1',
            numberOfSubscribers: 7,
            save: jest.fn().mockResolvedValueOnce(),
        };
        UserMock.findById
            .mockResolvedValueOnce(channelDoc)
            .mockResolvedValueOnce({ username: 'alice' });
        SubscriptionMock.findOne.mockResolvedValueOnce(null);
        subscriptionSaveMock.mockResolvedValueOnce();
        enqueueNotificationEventMock.mockResolvedValueOnce();
        enqueueAnalyticsEventMock.mockResolvedValueOnce();
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            body: { channelId: 'channel-1', notificationsEnabled: true },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await subscribeToChannel(req, res, next);

        expect(SubscriptionMock).toHaveBeenCalledWith({
            subscriberId: 'user-1',
            channelId: 'channel-1',
            notificationsEnabled: true,
        });
        expect(channelDoc.numberOfSubscribers).toBe(8);
        expect(channelDoc.save).toHaveBeenCalledTimes(1);
        expect(subscriptionSaveMock).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith([
            'subscriptions:user-subscriptions:user-1:',
            'subscriptions:subscribers:channel-1:',
        ]);
        expect(enqueueNotificationEventMock).toHaveBeenCalledTimes(1);
        expect(enqueueAnalyticsEventMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('unsubscribeFromChannel returns 404 when subscription not found', async () => {
        SubscriptionMock.findOne.mockResolvedValueOnce(null);

        const req = {
            body: { channelId: 'channel-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await unsubscribeFromChannel(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/subscription not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('toggleNotifications toggles current value and returns 200', async () => {
        const subscriptionDoc = {
            notificationsEnabled: true,
            save: jest.fn().mockResolvedValueOnce(),
        };
        SubscriptionMock.findOne.mockResolvedValueOnce(subscriptionDoc);

        const req = {
            body: { channelId: 'channel-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await toggleNotifications(req, res, next);

        expect(subscriptionDoc.notificationsEnabled).toBe(false);
        expect(subscriptionDoc.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('getUserSubscriptions returns paginated subscriptions', async () => {
        const subscriptions = [{ _id: 'sub-1', channelId: { username: 'chan1' } }];
        SubscriptionMock.find.mockReturnValueOnce(createSubscriptionListQueryChain(subscriptions));
        SubscriptionMock.countDocuments.mockResolvedValueOnce(1);

        const req = {
            user: { id: 'user-1' },
            query: { page: 1, limit: 10 },
        };
        const res = createRes();
        const next = jest.fn();

        await getUserSubscriptions(req, res, next);

        expect(SubscriptionMock.find).toHaveBeenCalledWith({ subscriberId: 'user-1' });
        expect(SubscriptionMock.countDocuments).toHaveBeenCalledWith({ subscriberId: 'user-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.message.subscriptions).toEqual(subscriptions);
        expect(responsePayload.message.totalSubscriptions).toBe(1);
        expect(next).not.toHaveBeenCalled();
    });

    it('getChannelSubscribers returns paginated subscriber list', async () => {
        const subscriptions = [{ _id: 'sub-1', subscriberId: { username: 'viewer1' } }];
        SubscriptionMock.find.mockReturnValueOnce(createSubscriptionListQueryChain(subscriptions));
        SubscriptionMock.countDocuments.mockResolvedValueOnce(1);

        const req = {
            user: { id: 'channel-1' },
            query: { page: 1, limit: 10 },
        };
        const res = createRes();
        const next = jest.fn();

        await getChannelSubscribers(req, res, next);

        expect(SubscriptionMock.find).toHaveBeenCalledWith({ channelId: 'channel-1' });
        expect(SubscriptionMock.countDocuments).toHaveBeenCalledWith({ channelId: 'channel-1' });
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.message.subscribers).toEqual(subscriptions);
        expect(responsePayload.message.totalSubscribers).toBe(1);
        expect(next).not.toHaveBeenCalled();
    });
});