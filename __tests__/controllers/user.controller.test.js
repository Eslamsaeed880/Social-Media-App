import { jest } from '@jest/globals';

const findOneMock = jest.fn();
const saveMock = jest.fn();

const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: { toString: () => 'user-id-1' },
    save: saveMock,
}));

UserMock.findOne = findOneMock;

const enqueueEmailEventMock = jest.fn();
const enqueueMediaJobMock = jest.fn();

await jest.unstable_mockModule('../../models/user.js', () => ({
    default: UserMock,
}));

await jest.unstable_mockModule('../../queues/emailQueue.js', () => ({
    enqueueEmailEvent: enqueueEmailEventMock,
}));

await jest.unstable_mockModule('../../queues/mediaQueue.js', () => ({
    enqueueMediaJob: enqueueMediaJobMock,
}));

await jest.unstable_mockModule('../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: jest.fn(),
}));

const { signUp, login } = await import('../../controllers/user.js');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('User Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('signUp', () => {
        it('returns 409 when user already exists', async () => {
            findOneMock.mockResolvedValueOnce({ _id: 'existing-user' });

            const req = {
                body: {
                    fullName: 'John Doe',
                    username: 'john',
                    email: 'john@example.com',
                    password: 'Password123',
                },
            };
            const res = createRes();
            const next = jest.fn();

            await signUp(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const errorArg = next.mock.calls[0][0];
            expect(errorArg.statusCode).toBe(409);
            expect(errorArg.message).toMatch(/already exists/i);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('creates user and returns 201 on success', async () => {
            findOneMock.mockResolvedValueOnce(null);
            saveMock.mockResolvedValueOnce();
            enqueueEmailEventMock.mockResolvedValueOnce();

            const req = {
                body: {
                    fullName: 'John Doe',
                    username: 'john',
                    email: 'john@example.com',
                    password: 'Password123',
                },
                files: {},
            };
            const res = createRes();
            const next = jest.fn();

            await signUp(req, res, next);

            expect(UserMock).toHaveBeenCalledWith({
                fullName: 'John Doe',
                username: 'john',
                email: 'john@example.com',
                password: 'Password123',
            });
            expect(saveMock).toHaveBeenCalledTimes(1);
            expect(enqueueEmailEventMock).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledTimes(1);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('returns 401 when user is not found', async () => {
            findOneMock.mockResolvedValueOnce(null);

            const req = {
                body: {
                    email: 'john@example.com',
                    password: 'Password123',
                },
            };
            const res = createRes();
            const next = jest.fn();

            await login(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const errorArg = next.mock.calls[0][0];
            expect(errorArg.statusCode).toBe(401);
            expect(errorArg.message).toMatch(/invalid email or password/i);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('returns 401 when password does not match', async () => {
            findOneMock.mockResolvedValueOnce({
                comparePassword: jest.fn().mockResolvedValueOnce(false),
            });

            const req = {
                body: {
                    email: 'john@example.com',
                    password: 'WrongPass123',
                },
            };
            const res = createRes();
            const next = jest.fn();

            await login(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            const errorArg = next.mock.calls[0][0];
            expect(errorArg.statusCode).toBe(401);
            expect(errorArg.message).toMatch(/invalid email or password/i);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('returns user and token on successful login', async () => {
            const existingUser = {
                _id: 'user-id-1',
                email: 'john@example.com',
                comparePassword: jest.fn().mockResolvedValueOnce(true),
                generateToken: jest.fn().mockReturnValue('token-123'),
            };
            findOneMock.mockResolvedValueOnce(existingUser);

            const req = {
                body: {
                    email: 'john@example.com',
                    password: 'Password123',
                },
            };
            const res = createRes();
            const next = jest.fn();

            await login(req, res, next);

            expect(existingUser.comparePassword).toHaveBeenCalledWith('Password123');
            expect(existingUser.generateToken).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledTimes(1);
            const responsePayload = res.json.mock.calls[0][0];
            expect(responsePayload.data.token).toBe('token-123');
            expect(next).not.toHaveBeenCalled();
        });
    });
});
