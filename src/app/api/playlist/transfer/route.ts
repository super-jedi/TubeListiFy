import { NextRequest, NextResponse } from 'next/server';
import { MatchResult } from '@/types';
import { createSpotifyPlaylist } from '@/lib/platforms/spotify';
import { createYouTubePlaylist } from '@/lib/platforms/youtube';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      targetPlatform = 'spotify',
      title = 'TubeListiFy Transferred Playlist',
      description = 'Synchronized across platforms via TubeListiFy',
      items = [],
      accessToken,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No playlist items supplied for transfer',
        },
        { status: 400 }
      );
    }

    // Filter items that have a valid matched track and are marked as selected
    const selectedItems = items.filter(
      (item: MatchResult) => item.selected !== false && item.matchedTrack
    );

    if (selectedItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid matches selected to add to the new playlist',
        },
        { status: 400 }
      );
    }

    let result: { id: string; url: string; isDemo?: boolean };

    if (targetPlatform === 'spotify') {
      const trackUris = selectedItems.map((item: MatchResult) => {
        return item.matchedTrack?.spotifyUri || `spotify:track:${item.matchedTrack?.id?.replace(/^sp_/, '')}`;
      });

      result = await createSpotifyPlaylist(title, description, trackUris, accessToken);
    } else {
      const videoIds = selectedItems.map((item: MatchResult) => {
        return item.matchedTrack?.youtubeVideoId || item.matchedTrack?.id?.replace(/^yt_/, '') || 'dQw4w9WgXcQ';
      });

      result = await createYouTubePlaylist(title, description, videoIds, accessToken);
    }

    return NextResponse.json({
      success: true,
      playlistId: result.id,
      playlistUrl: result.url,
      isDemo: Boolean(result.isDemo),
      transferredCount: selectedItems.length,
      targetPlatform,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to complete playlist transfer',
      },
      { status: 500 }
    );
  }
}
