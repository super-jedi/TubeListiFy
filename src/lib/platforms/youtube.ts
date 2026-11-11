import axios from 'axios';
import { Playlist, Track } from '../../types';
import { normalizeTrackMetadata } from '../matching/normalizer';

/**
 * Extract YouTube playlist ID from URL or ID string
 */
export function parseYouTubePlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Handle URL with ?list=... or &list=...
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];

  // Handle music.youtube.com/playlist?list=...
  if (trimmed.includes('/playlist?list=')) {
    const parts = trimmed.split('list=');
    if (parts[1]) {
      return parts[1].split('&')[0];
    }
  }

  // Handle standard playlist ID format (PL..., OLAK5uy_..., etc.)
  if (/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Mock YouTube Playlist Generator for Instant Demo & Offline Exploration
 */
export function getMockYouTubePlaylist(id: string = 'demo_yt_music_hits'): Playlist {
  const rawList = [
    {
      title: 'Alan Walker - Faded (Official Music Video) [4K Ultra HD]',
      channel: 'Alan Walker',
      duration: '3:32',
      durationMs: 212000,
      id: '60ItHLz5WEA',
      thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    },
    {
      title: 'Rick Astley - Never Gonna Give You Up (Official Video) [Remastered 2021]',
      channel: 'Rick Astley',
      duration: '3:33',
      durationMs: 213000,
      id: 'dQw4w9WgXcQ',
      thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    },
    {
      title: 'The Weeknd - Blinding Lights (Official Audio)',
      channel: 'The Weeknd',
      duration: '3:20',
      durationMs: 200000,
      id: '4NRXx6U8ABQ',
      thumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
    },
    {
      title: 'Dua Lipa - Levitating feat. DaBaby [Official Music Video]',
      channel: 'Dua Lipa',
      duration: '3:24',
      durationMs: 204000,
      id: 'TUVcZfQe-Kw',
      thumb: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&h=300&fit=crop',
    },
    {
      title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      channel: 'Queen Official',
      duration: '5:55',
      durationMs: 355000,
      id: 'fJ9rUzIMcZQ',
      thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    },
    {
      title: 'Adele - Rolling in the Deep (Lyric Video) [1080p]',
      channel: 'Adele',
      duration: '3:48',
      durationMs: 228000,
      id: 'rYEDA3JcQqw',
      thumb: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop',
    },
    {
      title: 'Coldplay - Viva La Vida (Official Video HD)',
      channel: 'Coldplay',
      duration: '4:02',
      durationMs: 242000,
      id: 'dvgZkm1xWPE',
      thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    },
    {
      title: 'Ed Sheeran - Shape of You [Official Music Video]',
      channel: 'Ed Sheeran',
      duration: '4:24',
      durationMs: 264000,
      id: 'JGwWNGJdvx8',
      thumb: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop',
    },
  ];

  const tracks: Track[] = rawList.map((item) => {
    const norm = normalizeTrackMetadata(item.title, item.channel);
    return {
      id: `yt_${item.id}`,
      rawTitle: item.title,
      title: norm.cleanTitle,
      artist: norm.cleanArtist || item.channel,
      durationMs: item.durationMs,
      durationFormatted: item.duration,
      thumbnailUrl: item.thumb,
      source: 'youtube',
      youtubeVideoId: item.id,
      externalUrl: `https://www.youtube.com/watch?v=${item.id}`,
    };
  });

  return {
    id: id || 'demo_yt_music_hits',
    title: 'YouTube Music Viral Video Favorites (Demo)',
    description: 'Messy real-world YouTube video titles ready for smart regex stripping and Spotify matching.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop',
    platform: 'youtube',
    trackCount: tracks.length,
    owner: 'YouTube Music Hub',
    tracks,
    externalUrl: `https://www.youtube.com/playlist?list=${id || 'PLrAl5KGt2D4xDemo'}`,
  };
}

/**
 * Fetch YouTube playlist and its items via YouTube Data API v3
 */
export async function fetchYouTubePlaylist(
  playlistId: string,
  apiKeyOrToken?: string,
  isToken: boolean = false
): Promise<Playlist> {
  if (!apiKeyOrToken) {
    return getMockYouTubePlaylist(playlistId);
  }

  try {
    const headers: Record<string, string> = {};
    const params: Record<string, any> = {
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
    };

    if (isToken) {
      headers['Authorization'] = `Bearer ${apiKeyOrToken}`;
    } else {
      params['key'] = apiKeyOrToken;
    }

    const tracks: Track[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      if (nextPageToken) {
        params['pageToken'] = nextPageToken;
      }

      const res = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        headers,
        params,
        timeout: 10000,
      });

      const items = res.data?.items || [];
      for (const item of items) {
        const snippet = item.snippet;
        const videoId = snippet?.resourceId?.videoId;
        if (!videoId || snippet.title === 'Private video' || snippet.title === 'Deleted video') continue;

        const norm = normalizeTrackMetadata(snippet.title, snippet.videoOwnerChannelTitle || snippet.channelTitle);

        tracks.push({
          id: `yt_${videoId}`,
          rawTitle: snippet.title,
          title: norm.cleanTitle,
          artist: norm.cleanArtist || snippet.channelTitle || 'Unknown Artist',
          thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
          source: 'youtube',
          youtubeVideoId: videoId,
          externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }

      nextPageToken = res.data?.nextPageToken;
    } while (nextPageToken && tracks.length < 500);

    return {
      id: playlistId,
      title: 'Imported YouTube Playlist',
      platform: 'youtube',
      trackCount: tracks.length,
      tracks,
      externalUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
    };
  } catch (err: any) {
    console.warn('[YouTube API] Fetch playlist items failed, using mock fallback:', err.message);
    return getMockYouTubePlaylist(playlistId);
  }
}

/**
 * Search YouTube for a music video candidate
 */
export async function searchYouTubeTrack(
  query: string,
  apiKeyOrToken?: string,
  isToken: boolean = false
): Promise<Track[]> {
  if (!apiKeyOrToken) {
    // Provide realistic mock candidate
    return [
      {
        id: `mock_yt_${Date.now()}`,
        title: query,
        artist: 'Official Music Video',
        durationMs: 220000,
        durationFormatted: '3:40',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
        source: 'youtube',
        youtubeVideoId: 'mock_video_id',
        externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      },
    ];
  }

  try {
    const headers: Record<string, string> = {};
    const params: Record<string, any> = {
      part: 'snippet',
      q: `${query} official audio`,
      type: 'video',
      maxResults: 5,
      videoCategoryId: '10', // Music category in YouTube API
    };

    if (isToken) {
      headers['Authorization'] = `Bearer ${apiKeyOrToken}`;
    } else {
      params['key'] = apiKeyOrToken;
    }

    const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      headers,
      params,
      timeout: 8000,
    });

    const items = res.data?.items || [];
    return items.map((item: any) => {
      const vid = item.id?.videoId;
      const snippet = item.snippet;
      const norm = normalizeTrackMetadata(snippet.title, snippet.channelTitle);

      return {
        id: `yt_${vid}`,
        rawTitle: snippet.title,
        title: norm.cleanTitle,
        artist: norm.cleanArtist || snippet.channelTitle || 'Unknown Artist',
        thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        source: 'youtube' as const,
        youtubeVideoId: vid,
        externalUrl: `https://www.youtube.com/watch?v=${vid}`,
      };
    });
  } catch (err: any) {
    console.warn('[YouTube Search] Search failed:', err.message);
    return [];
  }
}

/**
 * Create a new YouTube Playlist and batch add items
 */
export async function createYouTubePlaylist(
  title: string,
  description: string,
  videoIds: string[],
  accessToken?: string
): Promise<{ id: string; url: string; isDemo?: boolean }> {
  if (!accessToken) {
    return {
      id: 'demo_youtube_playlist',
      url: 'https://www.youtube.com/playlist?list=PLrAl5KGt2D4x-o3I-2X8bL2-Y6-0y7P8m',
      isDemo: true,
    };
  }

  // 1. Insert Playlist
  const createRes = await axios.post(
    'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
    {
      snippet: {
        title,
        description: `${description} • Created by TubeListiFy`,
      },
      status: {
        privacyStatus: 'private',
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const playlistId = createRes.data?.id;

  // 2. Batch add video items
  for (const videoId of videoIds) {
    try {
      await axios.post(
        'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
        {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Small pause to avoid quota throttle
      await new Promise((r) => setTimeout(r, 150));
    } catch (err: any) {
      console.warn(`[YouTube API] Failed to add video ${videoId}:`, err.message);
    }
  }

  return {
    id: playlistId,
    url: `https://www.youtube.com/playlist?list=${playlistId}`,
  };
}
