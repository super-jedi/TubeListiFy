import { NextRequest, NextResponse } from 'next/server';
import { searchSpotifyTrack } from '@/lib/platforms/spotify';
import { searchYouTubeTrack } from '@/lib/platforms/youtube';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const platform = (searchParams.get('platform') || 'spotify') as 'spotify' | 'youtube';
    const accessToken = searchParams.get('token') || undefined;

    if (!query.trim()) {
      return NextResponse.json({ success: true, results: [] });
    }

    if (platform === 'spotify') {
      const results = await searchSpotifyTrack(query, '', accessToken);
      return NextResponse.json({ success: true, platform, results });
    } else {
      const results = await searchYouTubeTrack(query, accessToken, Boolean(accessToken));
      return NextResponse.json({ success: true, platform, results });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
