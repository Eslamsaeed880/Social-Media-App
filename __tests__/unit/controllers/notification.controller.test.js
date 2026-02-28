import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const NotificationMock = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    findOne: jest.fn(),
};

const UserMock = {
    findById: jest.fn(),
};

const invalidateCacheByPrefixesMock = jest.fn();

await jest.unstable_mockModule('../../../models/notification.js', () => ({
    default: NotificationMock,
}));

await jest.unstable_mockModule('../../../models/user.js', () => ({
    default: UserMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const {
    getNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
} = await import('../../../controllers/notification.js');

describe('Notification Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getNotifications returns paginated notifications payload', async () => {
        NotificationMock.aggregate.mockResolvedValueOnce([{ _id: 'notif-1', isRead: false }]);
        NotificationMock.countDocuments
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(3);

        const req = {
            user: { id: '64c9f9a9f8a8c1d7b4c3a111' },
            query: { page: 1, limit: 10, unreadOnly: 'true' },
        };
        const res = createRes();
        const next = jest.fn();

        await getNotifications(req, res, next);

        expect(NotificationMock.aggregate).toHaveBeenCalledTimes(1);
        expect(NotificationMock.countDocuments).toHaveBeenCalledTimes(2);
        expect(res.status).toHaveBeenCalledWith(200);
        const responsePayload = res.json.mock.calls[0][0];
        expect(responsePayload.data.notifications).toHaveLength(1);
        expect(responsePayload.data.unreadCount).toBe(1);
        expect(responsePayload.data.totalCount).toBe(3);
        expect(next).not.toHaveBeenCalled();
    });

    it('markAllAsRead updates notifications and invalidates cache', async () => {
        NotificationMock.updateMany.mockResolvedValueOnce({ modifiedCount: 2 });
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = { user: { id: 'user-1' } };
        const res = createRes();
        const next = jest.fn();

        await markAllAsRead(req, res, next);

        expect(NotificationMock.updateMany).toHaveBeenCalledWith(
            { recipient: 'user-1', isRead: false },
            { $set: { isRead: true } }
        );
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['notifications:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('markAsRead returns 404 when notification does not exist', async () => {
        NotificationMock.findOne.mockResolvedValueOnce(null);

        const req = {
            params: { notificationId: 'notif-missing' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await markAsRead(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/notification not found/i);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('deleteNotification deletes notification and returns 200', async () => {
        const notificationDoc = {
            _id: 'notif-1',
            deleteOne: jest.fn().mockResolvedValueOnce(),
        };
        NotificationMock.findOne.mockResolvedValueOnce(notificationDoc);
        invalidateCacheByPrefixesMock.mockResolvedValueOnce();

        const req = {
            params: { notificationId: 'notif-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await deleteNotification(req, res, next);

        expect(notificationDoc.deleteOne).toHaveBeenCalledTimes(1);
        expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['notifications:all:user-1:']);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });
});