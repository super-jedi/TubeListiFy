import { NextRequest, NextResponse } from 'next/server';
import { parseSpotifyPlaylistId, fetchSpotifyPlaylist, getMockSpotifyPlaylist } from '@/lib/platforms/spotify';
import { parseYouTubePlaylistId, fetchYouTubePlaylist, getMockYouTubePlaylist } from '@/lib/platforms/youtube';
import { parsePastedTracklist } from '@/lib/exporters';
import { Platform } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url = '', text = '', platform = 'auto', accessToken, isDemo = false } = body;

    // Handle manual pasted text tracklist
    if (text && text.trim().length > 0) {
      const parsedTracks = parsePastedTracklist(text);
      return NextResponse.json({
        success: true,
        playlist: {
          id: `custom_${Date.now()}`,
          title: 'Imported Custom Tracklist',
          description: `Custom text import with ${parsedTracks.length} tracks`,
          platform: 'billboard' as Platform,
          trackCount: parsedTracks.length,
          tracks: parsedTracks,
        },
      });
    }

    const input = url.trim();

    // 1. Check if Spotify
    const spotifyId = parseSpotifyPlaylistId(input);
    const isSpotify = platform === 'spotify' || spotifyId !== null || input.includes('spotify.com');

    if (isSpotify) {
      const resolvedId = spotifyId || '37i9dQZF1DXcBWIGoYBM5M';
      const playlist = isDemo || !accessToken
        ? getMockSpotifyPlaylist(resolvedId)
        : await fetchSpotifyPlaylist(resolvedId, accessToken);

      return NextResponse.json({
        success: true,
        platform: 'spotify',
        playlist,
      });
    }

    // 2. Check if YouTube
    const youtubeId = parseYouTubePlaylistId(input);
    const isYouTube = platform === 'youtube' || youtubeId !== null || input.includes('youtube.com') || input.includes('youtu.be');

    if (isYouTube) {
      const resolvedId = youtubeId || 'PLrAl5KGt2D4xDemo';
      const playlist = isDemo || !accessToken
        ? getMockYouTubePlaylist(resolvedId)
        : await fetchYouTubePlaylist(resolvedId, accessToken);

      return NextResponse.json({
        success: true,
        platform: 'youtube',
        playlist,
      });
    }

    // Default to mock YouTube demo if no URL provided
    const defaultDemo = getMockYouTubePlaylist();
    return NextResponse.json({
      success: true,
      platform: 'youtube',
      playlist: defaultDemo,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch playlist',
      },
      { status: 500 }
    );
  }
}
