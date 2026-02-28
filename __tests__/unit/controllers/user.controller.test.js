import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const findOneMock = jest.fn();
const findByIdMock = jest.fn();
const saveMock = jest.fn();

const UserMock = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: { toString: () => 'user-id-1' },
    save: saveMock,
}));

UserMock.findOne = findOneMock;
UserMock.findById = findByIdMock;

const enqueueEmailEventMock = jest.fn();
const enqueueMediaJobMock = jest.fn();
const invalidateCacheByPrefixesMock = jest.fn();
const jwtSignMock = jest.fn(() => 'jwt-token-1');
const bcryptHashMock = jest.fn();

await jest.unstable_mockModule('../../../config/config.js', () => ({
    default: {
        googleCallbackURL: 'http://localhost:3000/api/v1/users/google/callback',
        googleClientId: 'google-client-id',
        jwtSecretKey: 'jwt-secret',
        tokenExpiry: '1h',
        bcryptSaltRounds: '10',
    },
}));

await jest.unstable_mockModule('jsonwebtoken', () => ({
    default: {
        sign: jwtSignMock,
    },
}));

await jest.unstable_mockModule('bcrypt', () => ({
    default: {
        hash: bcryptHashMock,
    },
}));

await jest.unstable_mockModule('../../../models/user.js', () => ({
    default: UserMock,
}));

await jest.unstable_mockModule('../../../queues/emailQueue.js', () => ({
    enqueueEmailEvent: enqueueEmailEventMock,
}));

await jest.unstable_mockModule('../../../queues/mediaQueue.js', () => ({
    enqueueMediaJob: enqueueMediaJobMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
    invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

const {
    signUp,
    login,
    getGoogleAuthUrl,
    googleLoginCallback,
    updateUserProfile,
    updateProfilePic,
    updateCover,
    getUserProfile,
    resetPassword,
    confirmResetPassword,
    changePassword,
} = await import('../../../controllers/user.js');

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

    describe('oauth and profile', () => {
        it('returns Google auth URL', async () => {
            const req = {};
            const res = createRes();

            await getGoogleAuthUrl(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const payload = res.json.mock.calls[0][0];
            expect(payload.data.authUrl).toMatch(/accounts\.google\.com/);
        });

        it('returns token in google callback', async () => {
            const req = {
                user: {
                    _id: 'user-id-1',
                    role: 'user',
                },
            };
            const res = createRes();

            await googleLoginCallback(req, res);

            expect(jwtSignMock).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            const payload = res.json.mock.calls[0][0];
            expect(payload.data.token).toBe('jwt-token-1');
        });

        it('updates user profile fields for owner', async () => {
            const userDoc = {
                _id: { toString: () => 'user-id-1' },
                fullName: 'Old',
                bio: '',
                save: jest.fn().mockResolvedValueOnce(),
            };
            findOneMock.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(userDoc),
            });

            const req = {
                params: { username: 'john' },
                user: { id: 'user-id-1' },
                body: { fullName: 'New Name', bio: 'New bio' },
            };
            const res = createRes();
            const next = jest.fn();

            await updateUserProfile(req, res, next);

            expect(userDoc.fullName).toBe('New Name');
            expect(userDoc.bio).toBe('New bio');
            expect(userDoc.save).toHaveBeenCalledTimes(1);
            expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['users:profile:john:']);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(next).not.toHaveBeenCalled();
        });

        it('removes profile picture when no file provided', async () => {
            const userDoc = {
                _id: { toString: () => 'user-id-1' },
                profilePicture: { publicId: 'old', url: 'old-url' },
                save: jest.fn().mockResolvedValueOnce(),
            };
            findOneMock.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(userDoc),
            });

            const req = {
                params: { username: 'john' },
                user: { id: 'user-id-1' },
            };
            const res = createRes();
            const next = jest.fn();

            await updateProfilePic(req, res, next);

            expect(userDoc.profilePicture.publicId).toBeUndefined();
            expect(userDoc.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(next).not.toHaveBeenCalled();
        });

        it('queues cover update when file is provided', async () => {
            const userDoc = {
                _id: { toString: () => 'user-id-1' },
            };
            findOneMock.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce(userDoc),
            });
            enqueueMediaJobMock.mockResolvedValueOnce({ id: 'job-1' });

            const req = {
                params: { username: 'john' },
                user: { id: 'user-id-1' },
                file: { path: '/tmp/cover.jpg' },
            };
            const res = createRes();
            const next = jest.fn();

            await updateCover(req, res, next);

            expect(enqueueMediaJobMock).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(202);
            expect(next).not.toHaveBeenCalled();
        });

        it('returns public profile by username', async () => {
            const profile = { username: 'john' };
            findOneMock.mockReturnValueOnce({
                lean: jest.fn().mockReturnValue({
                    select: jest.fn().mockResolvedValueOnce(profile),
                }),
            });

            const req = { params: { username: 'john' } };
            const res = createRes();
            const next = jest.fn();

            await getUserProfile(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            const payload = res.json.mock.calls[0][0];
            expect(payload.data.user).toEqual(profile);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('password flows', () => {
        it('creates reset token and enqueues email', async () => {
            const userDoc = {
                username: 'john',
                save: jest.fn().mockResolvedValueOnce(),
            };
            findOneMock.mockResolvedValueOnce(userDoc);
            enqueueEmailEventMock.mockResolvedValueOnce();

            const req = {
                body: { email: 'john@example.com' },
            };
            const res = createRes();
            const next = jest.fn();

            await resetPassword(req, res, next);

            expect(userDoc.resetToken).toBeTruthy();
            expect(userDoc.save).toHaveBeenCalledTimes(1);
            expect(enqueueEmailEventMock).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(next).not.toHaveBeenCalled();
        });

        it('confirms reset password and updates hashed password', async () => {
            const userDoc = {
                email: 'john@example.com',
                name: 'John',
                save: jest.fn().mockResolvedValueOnce(),
            };
            findOneMock.mockResolvedValueOnce(userDoc);
            bcryptHashMock.mockResolvedValueOnce('hashed-password');
            enqueueEmailEventMock.mockResolvedValueOnce();

            const req = {
                body: { password: 'NewPassword123' },
                query: { token: 'valid-token' },
            };
            const res = createRes();
            const next = jest.fn();

            await confirmResetPassword(req, res, next);

            expect(bcryptHashMock).toHaveBeenCalledTimes(1);
            expect(userDoc.password).toBe('hashed-password');
            expect(userDoc.resetToken).toBeNull();
            expect(userDoc.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(next).not.toHaveBeenCalled();
        });

        it('changes password for authenticated user', async () => {
            const userDoc = {
                comparePassword: jest.fn().mockResolvedValueOnce(true),
                save: jest.fn().mockResolvedValueOnce(),
            };
            findByIdMock.mockResolvedValueOnce(userDoc);
            bcryptHashMock.mockResolvedValueOnce('new-hashed');

            const req = {
                user: { id: 'user-id-1' },
                body: { currentPassword: 'OldPass123', newPassword: 'NewPass123' },
            };
            const res = createRes();
            const next = jest.fn();

            await changePassword(req, res, next);

            expect(findByIdMock).toHaveBeenCalledWith('user-id-1');
            expect(userDoc.comparePassword).toHaveBeenCalledWith('OldPass123');
            expect(userDoc.password).toBe('new-hashed');
            expect(userDoc.save).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
