/**
 * TubeListiFy Music Metadata Normalizer
 * High-accuracy regex heuristic pipeline to strip YouTube noise,
 * extract clean artist/title pairs, and canonicalize music metadata.
 */

export interface NormalizedMetadata {
  rawTitle: string;
  cleanTitle: string;
  cleanArtist: string;
  hasFeaturing: boolean;
  featuredArtists: string[];
  inferredSource: 'artist-dash-title' | 'title-dash-artist' | 'title-only' | 'topic-video';
}

const NOISE_PATTERNS = [
  // Video quality and formats
  /\[\s*(?:4k|8k|1080p|720p|hd|hq|uhd)\s*(?:ultra\s*hd)?\s*\]/gi,
  /\(\s*(?:4k|8k|1080p|720p|hd|hq|uhd)\s*(?:ultra\s*hd)?\s*\)/gi,
  
  // Official video / audio tags (with optional remastered note inside)
  /\[\s*(?:official\s+)?(?:music\s+)?(?:video|audio|lyric\s+video|visualizer|clip|stream|track)(?:\s+remaster(?:ed)?)?\s*\]/gi,
  /\(\s*(?:official\s+)?(?:music\s+)?(?:video|audio|lyric\s+video|visualizer|clip|stream|track)(?:\s+remaster(?:ed)?)?\s*\)/gi,
  /\[\s*(?:music\s+video|lyric\s+video|audio|lyrics|visualizer|mv)\s*\]/gi,
  /\(\s*(?:music\s+video|lyric\s+video|audio|lyrics|visualizer|mv)\s*\)/gi,
  
  // Remastered, live, explicit, extended
  /\[\s*(?:remaster(?:ed)?|remaster(?:ed)?\s*\d{4}|\d{4}\s*remaster(?:ed)?|\d{4}\s*digital\s*remaster(?:ed)?)\s*\]/gi,
  /\(\s*(?:remaster(?:ed)?|remaster(?:ed)?\s*\d{4}|\d{4}\s*remaster(?:ed)?|\d{4}\s*digital\s*remaster(?:ed)?)\s*\)/gi,
  /\[\s*(?:explicit|clean|bass\s*boosted|slowed\s*\+\s*reverb|8d\s*audio)\s*\]/gi,
  /\(\s*(?:explicit|clean|bass\s*boosted|slowed\s*\+\s*reverb|8d\s*audio)\s*\)/gi,
  
  // French / Spanish / German common video tags
  /\[\s*(?:clip\s*officiel|video\s*oficial|audio\s*oficial)\s*\]/gi,
  /\(\s*(?:clip\s*officiel|video\s*oficial|audio\s*oficial)\s*\)/gi,

  // General standalone words at end
  /\s+-\s+official\s+(?:video|audio)/gi,
  /\b(?:official\s+)?(?:video|audio)\s+remaster(?:ed)?\b/gi,
  /\b(official\s+video|official\s+audio)\b/gi,
];

// Featuring patterns
const FEATURING_REGEX = /\s*(?:\[|\()?(?:feat\.?|featuring|ft\.?|with)\s+([^\]\)]+)(?:\]|\))?/gi;

export function stripNoise(text: string): string {
  let cleaned = text;

  // Remove standard noise patterns
  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Remove trailing and leading punctuation/quotes/brackets
  cleaned = cleaned
    .replace(/^["'“”‘’\(\[\{]+|["'“”‘’\)\]\}]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // If there are still empty parens like () or [], remove them
  cleaned = cleaned.replace(/\(\s*\)|\[\s*\]/g, '').trim();

  return cleaned;
}

export function extractFeaturing(text: string): { baseText: string; featured: string[] } {
  const featured: string[] = [];
  const baseText = text.replace(FEATURING_REGEX, (_, match) => {
    if (match) {
      // Split multiple featured artists e.g. "DaBaby & Young Thug"
      const artists = match
        .split(/[,&/]/)
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);
      featured.push(...artists);
    }
    return '';
  });

  return {
    baseText: baseText.trim(),
    featured,
  };
}

/**
 * Normalizes a raw track title (and optional channel/fallback artist)
 * into a structured artist + song title.
 */
export function normalizeTrackMetadata(rawTitle: string, channelName: string = ''): NormalizedMetadata {
  let cleanRaw = rawTitle.trim();

  // Strip YouTube Topic suffix e.g. "Release - Topic" -> "Release"
  const cleanChannel = channelName.replace(/\s*-\s*Topic$/i, '').trim();
  const isTopic = rawTitle.includes('- Topic') || channelName.includes('- Topic');

  // Remove common YouTube topic artifacts
  cleanRaw = cleanRaw.replace(/\s*-\s*Topic$/i, '').trim();

  // Strip noise patterns
  let working = stripNoise(cleanRaw);

  // Extract featuring info
  const featInfo = extractFeaturing(working);
  working = featInfo.baseText;

  let inferredSource: NormalizedMetadata['inferredSource'] = 'title-only';
  let artist = '';
  let title = '';

  // Check for common delimiter: "Artist - Title" (or "–", "—", ":")
  const dashSplit = working.split(/\s+[-–—:]\s+/);

  if (dashSplit.length >= 2) {
    if (cleanChannel) {
      const ch = cleanChannel.toLowerCase();
      const first = dashSplit[0].trim().toLowerCase();
      const second = dashSplit[1].trim().toLowerCase();

      // If channel name matches second part (e.g. "Blinding Lights - The Weeknd"), flip to Title - Artist
      if (second.includes(ch) && !first.includes(ch)) {
        title = dashSplit[0].trim();
        artist = dashSplit.slice(1).join(' - ').trim();
        inferredSource = 'title-dash-artist';
      } else {
        artist = dashSplit[0].trim();
        title = dashSplit.slice(1).join(' - ').trim();
        inferredSource = 'artist-dash-title';
      }
    } else {
      artist = dashSplit[0].trim();
      title = dashSplit.slice(1).join(' - ').trim();
      inferredSource = 'artist-dash-title';
    }
  } else {
    // If no delimiter found, but we have a channel name, use channel as artist
    if (cleanChannel && !cleanChannel.toLowerCase().includes('vevo') && cleanChannel.toLowerCase() !== 'youtube') {
      artist = cleanChannel.replace(/vevo$/i, '').trim();
      title = working;
      inferredSource = 'title-dash-artist';
    } else {
      title = working;
      artist = '';
      inferredSource = 'title-only';
    }
  }

  // Clean quotes and dangling punctuation from title and artist
  title = title.replace(/^["'“”‘’\(\[\{\-–—]+|["'“”‘’\)\]\}\-–—]+$/g, '').trim();
  artist = artist.replace(/^["'“”‘’\(\[\{\-–—]+|["'“”‘’\)\]\}\-–—]+$/g, '').trim();

  // Final sanity fallback
  if (!title) {
    title = stripNoise(rawTitle);
  }

  return {
    rawTitle,
    cleanTitle: title,
    cleanArtist: artist,
    hasFeaturing: featInfo.featured.length > 0,
    featuredArtists: featInfo.featured,
    inferredSource: isTopic ? 'topic-video' : inferredSource,
  };
}

/**
 * Formats milliseconds into M:SS or H:MM:SS
 */
export function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}:${remainingMins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parses duration string (e.g., "3:45", "PT3M45S") to milliseconds
 */
export function parseDurationMs(durationStr: string): number {
  if (!durationStr) return 0;

  // Handle ISO 8601 duration format from YouTube API e.g. PT3M45S
  if (durationStr.startsWith('PT')) {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
  }

  // Handle standard "M:SS" or "H:MM:SS"
  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return (parts[0] * 60 + parts[1]) * 1000;
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  }

  return 0;
}
