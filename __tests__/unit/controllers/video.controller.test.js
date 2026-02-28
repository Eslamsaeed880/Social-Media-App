import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';
const VideoMock = {
	findById: jest.fn(),
	find: jest.fn(),
	countDocuments: jest.fn(),
	aggregate: jest.fn(),
};

const UserMock = {
	findById: jest.fn(),
};

const SubscriptionMock = {
	find: jest.fn(),
};

const VideoCategoryMock = {
	findOne: jest.fn(),
	create: jest.fn(),
};

const WatchHistoryMock = {
	find: jest.fn(),
};

const enqueueMediaJobMock = jest.fn();
const enqueueAnalyticsEventMock = jest.fn();
const enqueueNotificationEventMock = jest.fn();
const addToWatchHistoryMock = jest.fn();
const invalidateCacheByPrefixesMock = jest.fn();
const setCacheMock = jest.fn();
const getCacheMock = jest.fn();
const buildCacheKeyMock = jest.fn(() => 'cache-key');
const deleteFromCloudinaryMock = jest.fn();
const uploadToCloudinaryMock = jest.fn();
const computeVideoScoreMock = jest.fn(() => 1);
const computePersonalizedScoreMock = jest.fn(() => 1);

await jest.unstable_mockModule('../../../models/video.js', () => ({
	default: VideoMock,
}));

await jest.unstable_mockModule('../../../models/user.js', () => ({
	default: UserMock,
}));

await jest.unstable_mockModule('../../../models/subscription.js', () => ({
	default: SubscriptionMock,
}));

await jest.unstable_mockModule('../../../models/videoCategory.js', () => ({
	default: VideoCategoryMock,
}));

await jest.unstable_mockModule('../../../models/watchHistory.js', () => ({
	default: WatchHistoryMock,
}));

await jest.unstable_mockModule('../../../utils/cloudinary.js', () => ({
	deleteFromCloudinary: deleteFromCloudinaryMock,
	uploadToCloudinary: uploadToCloudinaryMock,
}));

await jest.unstable_mockModule('../../../utils/addToWatchHistory.js', () => ({
	addToWatchHistory: addToWatchHistoryMock,
}));

await jest.unstable_mockModule('../../../queues/analyticsQueue.js', () => ({
	enqueueAnalyticsEvent: enqueueAnalyticsEventMock,
}));

await jest.unstable_mockModule('../../../queues/notificationsQueue.js', () => ({
	enqueueNotificationEvent: enqueueNotificationEventMock,
}));

await jest.unstable_mockModule('../../../utils/redisCache.js', () => ({
	buildCacheKey: buildCacheKeyMock,
	getCache: getCacheMock,
	setCache: setCacheMock,
	invalidateCacheByPrefixes: invalidateCacheByPrefixesMock,
}));

await jest.unstable_mockModule('../../../queues/mediaQueue.js', () => ({
	enqueueMediaJob: enqueueMediaJobMock,
}));

await jest.unstable_mockModule('../../../utils/computeVideoScore.js', () => ({
	computeVideoScore: computeVideoScoreMock,
}));

await jest.unstable_mockModule('../../../utils/computePersonalizedScore.js', () => ({
	computePersonalizedScore: computePersonalizedScoreMock,
}));

const { postVideo, getVideoById, togglePublishVideo, updateVideo, deleteVideo, getTrendingVideos, getMyVideos, getRecommendedVideos } = await import('../../../controllers/video.js');

describe('Video Controller', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('postVideo', () => {
		it('returns 400 when required files are missing', async () => {
			const req = {
				body: {
					title: 'Demo',
					description: 'Video description',
				},
				user: { id: 'user-1' },
				files: {},
			};
			const res = createRes();
			const next = jest.fn();

			await postVideo(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(400);
			expect(errorArg.message).toMatch(/video file and thumbnail are required/i);
			expect(enqueueMediaJobMock).not.toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('queues media upload job and returns 202', async () => {
			VideoCategoryMock.findOne.mockResolvedValueOnce({ name: 'Education' });
			enqueueMediaJobMock.mockResolvedValueOnce({ id: 'job-1' });

			const req = {
				body: {
					title: 'Demo',
					description: 'Video description',
					tags: '["node","express"]',
					category: 'Education',
					ageRestriction: false,
					isPublished: true,
				},
				user: { id: 'user-1' },
				files: {
					videoFile: [{ path: '/tmp/video.mp4' }],
					thumbnail: [{ path: '/tmp/thumb.jpg' }],
				},
			};
			const res = createRes();
			const next = jest.fn();

			await postVideo(req, res, next);

			expect(VideoCategoryMock.findOne).toHaveBeenCalledWith({
				name: { $regex: 'Education', $options: 'i' },
			});
			expect(enqueueMediaJobMock).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(202);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getVideoById', () => {
		it('returns 404 when video is not found', async () => {
			VideoMock.findById.mockReturnValueOnce({
				populate: jest.fn().mockResolvedValueOnce(null),
			});

			const req = {
				params: { id: 'missing-video' },
			};
			const res = createRes();
			const next = jest.fn();

			await getVideoById(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(404);
			expect(errorArg.message).toMatch(/video not found/i);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('increments views and records side effects for authenticated user', async () => {
			const videoDoc = {
				_id: 'video-1',
				isPublished: true,
				views: 10,
				duration: 7,
				publisherId: {
					_id: 'publisher-1',
					toString: () => 'publisher-1',
				},
				save: jest.fn().mockResolvedValueOnce(),
			};

			VideoMock.findById.mockReturnValueOnce({
				populate: jest.fn().mockResolvedValueOnce(videoDoc),
			});
			enqueueAnalyticsEventMock.mockResolvedValueOnce();
			addToWatchHistoryMock.mockResolvedValueOnce();
			invalidateCacheByPrefixesMock.mockResolvedValue();

			const req = {
				params: { id: 'video-1' },
				user: {
					id: 'user-1',
					gender: 'male',
				},
			};
			const res = createRes();
			const next = jest.fn();

			await getVideoById(req, res, next);

			expect(addToWatchHistoryMock).toHaveBeenCalledWith('user-1', 'video-1');
			expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith(['watch-history:all:user-1:']);
			expect(videoDoc.views).toBe(11);
			expect(videoDoc.save).toHaveBeenCalledTimes(1);
			expect(enqueueAnalyticsEventMock).toHaveBeenCalledTimes(1);
			const analyticsArg = enqueueAnalyticsEventMock.mock.calls[0][0];
			expect(analyticsArg.type).toBe('VIDEO_VIEWED');
			expect(analyticsArg.channelId).toBe('publisher-1');
			expect(analyticsArg.videoId).toBe('video-1');
			expect(analyticsArg.userId).toBe('user-1');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('togglePublishVideo', () => {
		it('returns 404 when video does not exist', async () => {
			VideoMock.findById.mockResolvedValueOnce(null);

			const req = {
				params: { id: 'missing-video' },
				user: { id: 'user-1' },
			};
			const res = createRes();
			const next = jest.fn();

			await togglePublishVideo(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(404);
			expect(errorArg.message).toMatch(/video not found/i);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('returns 403 when user is not owner', async () => {
			VideoMock.findById.mockResolvedValueOnce({
				publisherId: { toString: () => 'owner-1' },
			});

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-2' },
			};
			const res = createRes();
			const next = jest.fn();

			await togglePublishVideo(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(403);
			expect(errorArg.message).toMatch(/not allowed/i);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('toggles publication state and invalidates cache', async () => {
			const videoDoc = {
				_id: 'video-1',
				publisherId: { toString: () => 'user-1' },
				isPublished: true,
				save: jest.fn().mockResolvedValueOnce(),
			};
			VideoMock.findById.mockResolvedValueOnce(videoDoc);
			invalidateCacheByPrefixesMock.mockResolvedValueOnce();

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-1' },
			};
			const res = createRes();
			const next = jest.fn();

			await togglePublishVideo(req, res, next);

			expect(videoDoc.isPublished).toBe(false);
			expect(videoDoc.save).toHaveBeenCalledTimes(1);
			expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith('videos:');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalled();
			expect(UserMock.findById).not.toHaveBeenCalled();
		});
	});

	describe('updateVideo', () => {
		it('returns 400 when no fields provided', async () => {
			VideoMock.findById.mockResolvedValueOnce({
				publisherId: { toString: () => 'user-1' },
			});

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-1' },
				body: {},
			};
			const res = createRes();
			const next = jest.fn();

			await updateVideo(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(400);
			expect(errorArg.message).toMatch(/no fields provided/i);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('updates allowed attributes and returns 200', async () => {
			const videoDoc = {
				publisherId: { toString: () => 'user-1' },
				title: 'Old title',
				description: 'Old description',
				tags: ['old'],
				category: 'Old',
				ageRestriction: false,
				save: jest.fn().mockResolvedValueOnce(),
			};
			VideoMock.findById.mockResolvedValueOnce(videoDoc);
			invalidateCacheByPrefixesMock.mockResolvedValueOnce();

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-1' },
				body: {
					title: 'New title',
					description: 'New description',
					tags: ['new'],
					category: 'Education',
					ageRestriction: true,
					randomField: 'ignored',
				},
			};
			const res = createRes();
			const next = jest.fn();

			await updateVideo(req, res, next);

			expect(videoDoc.title).toBe('New title');
			expect(videoDoc.description).toBe('New description');
			expect(videoDoc.tags).toEqual(['new']);
			expect(videoDoc.category).toBe('Education');
			expect(videoDoc.ageRestriction).toBe(true);
			expect(videoDoc.randomField).toBeUndefined();
			expect(videoDoc.save).toHaveBeenCalledTimes(1);
			expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith('videos:');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('deleteVideo', () => {
		it('returns 403 when user is not owner', async () => {
			VideoMock.findById.mockResolvedValueOnce({
				publisherId: { toString: () => 'owner-1' },
			});

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-2' },
			};
			const res = createRes();
			const next = jest.fn();

			await deleteVideo(req, res, next);

			expect(next).toHaveBeenCalledTimes(1);
			const errorArg = next.mock.calls[0][0];
			expect(errorArg.statusCode).toBe(403);
			expect(errorArg.message).toMatch(/not allowed/i);
			expect(res.status).not.toHaveBeenCalled();
		});

		it('deletes media assets and video record', async () => {
			const videoDoc = {
				publisherId: { toString: () => 'user-1' },
				videoFile: { publicId: 'video-public-id' },
				thumbnail: { publicId: 'thumb-public-id' },
				deleteOne: jest.fn().mockResolvedValueOnce(),
			};
			VideoMock.findById.mockResolvedValueOnce(videoDoc);
			deleteFromCloudinaryMock.mockResolvedValue();
			invalidateCacheByPrefixesMock.mockResolvedValueOnce();

			const req = {
				params: { id: 'video-1' },
				user: { id: 'user-1' },
			};
			const res = createRes();
			const next = jest.fn();

			await deleteVideo(req, res, next);

			expect(deleteFromCloudinaryMock).toHaveBeenNthCalledWith(1, 'video-public-id');
			expect(deleteFromCloudinaryMock).toHaveBeenNthCalledWith(2, 'thumb-public-id');
			expect(videoDoc.deleteOne).toHaveBeenCalledTimes(1);
			expect(invalidateCacheByPrefixesMock).toHaveBeenCalledWith('videos:');
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getTrendingVideos', () => {
		it('returns ranked trending videos and caches ids', async () => {
			VideoMock.find.mockReturnValueOnce({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockResolvedValueOnce([
						{ _id: { toString: () => 'v1' }, views: 10, likes: 3, comments: 1, createdAt: new Date() },
					]),
				}),
			});

			const req = { query: {} };
			const res = createRes();
			const next = jest.fn();

			await getTrendingVideos(req, res, next);

			expect(VideoMock.find).toHaveBeenCalledTimes(1);
			expect(setCacheMock).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getMyVideos', () => {
		it('returns current user videos using aggregate pagination', async () => {
			VideoMock.countDocuments.mockResolvedValueOnce(1);
			VideoMock.aggregate.mockResolvedValueOnce([{ _id: 'video-1' }]);

			const req = {
				query: { page: 1, limit: 10 },
				user: { id: '64c9f9a9f8a8c1d7b4c3a111' },
			};
			const res = createRes();
			const next = jest.fn();

			await getMyVideos(req, res, next);

			expect(VideoMock.countDocuments).toHaveBeenCalledTimes(1);
			expect(VideoMock.aggregate).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('getRecommendedVideos', () => {
		it('returns recommended videos from cached trending ids', async () => {
			getCacheMock.mockResolvedValueOnce(['video-1']);
			VideoMock.find.mockReturnValueOnce({
				populate: jest.fn().mockReturnValue({
					lean: jest.fn().mockResolvedValueOnce([
						{ _id: 'video-1', title: 'Demo', publisherId: { _id: 'pub-1' } },
					]),
				}),
			});

			const req = {
				query: { page: 1, limit: 10, allowRewatch: 'true' },
				user: { id: 'user-1' },
			};
			const res = createRes();
			const next = jest.fn();

			await getRecommendedVideos(req, res, next);

			expect(getCacheMock).toHaveBeenCalledTimes(1);
			expect(VideoMock.find).toHaveBeenCalledTimes(1);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(next).not.toHaveBeenCalled();
		});
	});
});

