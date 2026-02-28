import { jest } from '@jest/globals';
import { createRes } from '../utils/httpTestUtils.js';

const playlistSaveMock = jest.fn();

const PlaylistMock = jest.fn().mockImplementation((data = {}) => ({
    ...data,
    _id: data._id || 'playlist-1',
    save: playlistSaveMock,
}));

PlaylistMock.find = jest.fn();
PlaylistMock.findById = jest.fn();

const VideoMock = {
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
};

await jest.unstable_mockModule('../../../models/playlist.js', () => ({
    default: PlaylistMock,
}));

await jest.unstable_mockModule('../../../models/video.js', () => ({
    default: VideoMock,
}));

const { createPlaylist, getUserPlaylists, addVideoToPlaylist, getPlaylistVideos } = await import('../../../controllers/playlist.js');

describe('Playlist Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createPlaylist creates and returns 201', async () => {
        playlistSaveMock.mockResolvedValueOnce();

        const req = {
            body: {
                name: 'My playlist',
                description: 'desc',
                videoIds: ['video-1'],
                isPublic: true,
                tags: ['news'],
            },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await createPlaylist(req, res, next);

        expect(PlaylistMock).toHaveBeenCalledWith({
            name: 'My playlist',
            description: 'desc',
            videos: ['video-1'],
            isPublic: true,
            tags: ['news'],
            createdBy: 'user-1',
        });
        expect(playlistSaveMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(next).not.toHaveBeenCalled();
    });

    it('getUserPlaylists uses public filter for other users', async () => {
        PlaylistMock.find.mockResolvedValueOnce([{ _id: 'playlist-1', isPublic: true }]);

        const req = {
            params: { userId: 'user-2' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await getUserPlaylists(req, res, next);

        expect(PlaylistMock.find).toHaveBeenCalledWith({ createdBy: 'user-2', isPublic: true });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();
    });

    it('addVideoToPlaylist returns 404 when playlist is missing', async () => {
        PlaylistMock.findById.mockResolvedValueOnce(null);

        const req = {
            params: { playlistId: 'missing-playlist' },
            body: { videoId: 'video-1' },
            user: { id: 'user-1' },
        };
        const res = createRes();
        const next = jest.fn();

        await addVideoToPlaylist(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(404);
        expect(errorArg.message).toMatch(/playlist not found/i);
    });

    it('getPlaylistVideos returns 403 for private playlist non-owner', async () => {
        PlaylistMock.findById.mockResolvedValueOnce({
            isPublic: false,
            createdBy: { toString: () => 'owner-1' },
            videos: ['video-1'],
        });

        const req = {
            params: { playlistId: 'playlist-1' },
            query: { page: 1, limit: 10 },
            user: { id: 'user-2' },
        };
        const res = createRes();
        const next = jest.fn();

        await getPlaylistVideos(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        const errorArg = next.mock.calls[0][0];
        expect(errorArg.statusCode).toBe(403);
        expect(errorArg.message).toMatch(/private/i);
        expect(VideoMock.find).not.toHaveBeenCalled();
    });
});