import { NextRequest, NextResponse } from 'next/server';
import { scrapeBillboardHot100 } from '@/lib/billboard/scraper';
import { HISTORICAL_MILESTONES } from '@/lib/billboard/milestones';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const result = await scrapeBillboardHot100(date, { limit });

    return NextResponse.json({
      success: true,
      date: result.date,
      source: result.source,
      count: result.items.length,
      items: result.items,
      milestones: HISTORICAL_MILESTONES,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Billboard Hot 100 chart',
      },
      { status: 500 }
    );
  }
}
