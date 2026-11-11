import axios from 'axios';
import * as cheerio from 'cheerio';
import { BillboardChartItem } from '../../types';
import { HISTORICAL_FALLBACKS } from './fallbackData';

// In-memory cache for scraped charts to minimize redundant calls
const chartCache = new Map<string, { timestamp: number; items: BillboardChartItem[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export interface ScrapeOptions {
  limit?: number;
  useCache?: boolean;
}

/**
 * Clean whitespace and newlines from parsed text
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Format any date string to valid Billboard chart format YYYY-MM-DD
 */
export function formatChartDate(inputDate?: string): string {
  if (!inputDate) {
    const now = new Date();
    // Billboard charts are dated on Saturdays
    return now.toISOString().split('T')[0];
  }

  // Validate format YYYY-MM-DD
  const match = inputDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const d = new Date(inputDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  // Bound between 1958-08-04 and today
  const minDate = new Date('1958-08-04');
  const maxDate = new Date();
  const targetDate = new Date(inputDate);

  if (targetDate < minDate) return '1958-08-04';
  if (targetDate > maxDate) return maxDate.toISOString().split('T')[0];

  return inputDate;
}

/**
 * Scrapes Billboard Hot 100 for a given date
 */
export async function scrapeBillboardHot100(
  dateStr?: string,
  options: ScrapeOptions = {}
): Promise<{ date: string; items: BillboardChartItem[]; source: 'live' | 'cache' | 'fallback' }> {
  const chartDate = formatChartDate(dateStr);
  const limit = options.limit || 100;

  // 1. Check in-memory cache
  if (options.useCache !== false && chartCache.has(chartDate)) {
    const cached = chartCache.get(chartDate)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        date: chartDate,
        items: cached.items.slice(0, limit),
        source: 'cache',
      };
    }
  }

  const url = `https://www.billboard.com/charts/hot-100/${chartDate}/`;
  const items: BillboardChartItem[] = [];

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 8000,
    });

    const $ = cheerio.load(response.data);

    // Modern Billboard layout parsing
    $('div.o-chart-results-list-row-container').each((index, element) => {
      if (items.length >= limit) return false;

      const $row = $(element);

      // Rank
      const rankText = cleanText(
        $row.find('span.c-label.a-font-primary-bold-l, span.c-label.a-font-primary-m').first().text()
      );
      const rank = parseInt(rankText, 10) || items.length + 1;

      // Song Title
      const title = cleanText(
        $row.find('h3#title-of-a-story').first().text()
      );

      // Artist name
      // Usually the next span.c-label after the title
      let artist = cleanText(
        $row.find('h3#title-of-a-story').next('span.c-label').text()
      );

      if (!artist) {
        artist = cleanText(
          $row.find('span.c-label.a-no-trucate').first().text()
        );
      }

      // Stats (last week, peak, weeks on chart)
      const statsSpans = $row.find('ul.lrv-a-unstyle-list li span.c-label');
      let lastWeekRank: number | null = null;
      let peakRank = rank;
      let weeksOnChart = 1;

      if (statsSpans.length >= 3) {
        const lw = cleanText($(statsSpans[0]).text());
        lastWeekRank = lw === '-' ? null : parseInt(lw, 10) || null;
        peakRank = parseInt(cleanText($(statsSpans[1]).text()), 10) || rank;
        weeksOnChart = parseInt(cleanText($(statsSpans[2]).text()), 10) || 1;
      }

      // Cover art thumbnail
      const coverUrl = $row.find('img').first().attr('src') || undefined;

      if (title && artist) {
        items.push({
          rank,
          title,
          artist,
          lastWeekRank,
          peakRank,
          weeksOnChart,
          coverUrl,
        });
      }
    });

    // If scraper found songs, save to cache and return
    if (items.length >= 5) {
      chartCache.set(chartDate, { timestamp: Date.now(), items });
      return {
        date: chartDate,
        items: items.slice(0, limit),
        source: 'live',
      };
    }
  } catch (err) {
    // Live scrape failed or rate-limited; fallback gracefully
    console.warn(`[Billboard Scraper] Live scrape for ${chartDate} failed or timed out:`, (err as Error).message);
  }

  // Fallback to high-quality curated historical records
  const fallbackChart = getFallbackChart(chartDate);
  chartCache.set(chartDate, { timestamp: Date.now(), items: fallbackChart });

  return {
    date: chartDate,
    items: fallbackChart.slice(0, limit),
    source: 'fallback',
  };
}

/**
 * Retrieves the closest historical fallback dataset if live scrape is unreachable
 */
function getFallbackChart(targetDate: string): BillboardChartItem[] {
  if (HISTORICAL_FALLBACKS[targetDate]) {
    return HISTORICAL_FALLBACKS[targetDate];
  }

  // Find nearest milestone
  const targetYear = parseInt(targetDate.split('-')[0], 10);
  const dates = Object.keys(HISTORICAL_FALLBACKS);
  
  let closestDate = dates[0];
  let minDiff = 9999;

  for (const date of dates) {
    const year = parseInt(date.split('-')[0], 10);
    const diff = Math.abs(year - targetYear);
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = date;
    }
  }

  return HISTORICAL_FALLBACKS[closestDate] || HISTORICAL_FALLBACKS['1985-07-13'];
}
