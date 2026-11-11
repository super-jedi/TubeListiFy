import test from 'node:test';
import assert from 'node:assert/strict';

import {
  stripNoise,
  extractFeaturing,
  normalizeTrackMetadata,
  formatDuration,
  parseDurationMs,
} from '../src/lib/matching/normalizer';

import {
  levenshteinDistance,
  stringSimilarityRatio,
  tokenSortRatio,
  scoreTrackMatch,
} from '../src/lib/matching/fuzzy';

import {
  exportToM3U,
  exportToCSV,
  exportToJSON,
  parsePastedTracklist,
} from '../src/lib/exporters/index';

import { formatChartDate } from '../src/lib/billboard/scraper';
import { Track } from '../src/types';

test('stripNoise: removes video quality tags, official tags, and remasters', () => {
  const cases = [
    {
      input: 'Alan Walker - Faded (Official Music Video) [4K Ultra HD]',
      expected: 'Alan Walker - Faded',
    },
    {
      input: 'Rick Astley - Never Gonna Give You Up (Official Video) [Remastered 2021]',
      expected: 'Rick Astley - Never Gonna Give You Up',
    },
    {
      input: 'The Weeknd - Blinding Lights (Official Audio)',
      expected: 'The Weeknd - Blinding Lights',
    },
    {
      input: 'Adele - Rolling in the Deep (Lyric Video) [1080p]',
      expected: 'Adele - Rolling in the Deep',
    },
    {
      input: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      expected: 'Queen – Bohemian Rhapsody',
    },
  ];

  for (const c of cases) {
    const cleaned = stripNoise(c.input);
    assert.equal(cleaned, c.expected);
  }
});

test('extractFeaturing: extracts featuring guest artists accurately', () => {
  const input = 'Levitating feat. DaBaby';
  const result = extractFeaturing(input);
  assert.equal(result.baseText, 'Levitating');
  assert.deepEqual(result.featured, ['DaBaby']);

  const multi = 'Smooth ft. Rob Thomas & Santana';
  const multiResult = extractFeaturing(multi);
  assert.equal(multiResult.baseText, 'Smooth');
  assert.ok(multiResult.featured.length >= 2);
});

test('normalizeTrackMetadata: parses messy YouTube video titles to canonical metadata', () => {
  const n1 = normalizeTrackMetadata(
    'Alan Walker - Faded (Official Music Video) [4K Ultra HD]',
    'Alan Walker'
  );
  assert.equal(n1.cleanArtist, 'Alan Walker');
  assert.equal(n1.cleanTitle, 'Faded');

  const n2 = normalizeTrackMetadata(
    'Rick Astley - Never Gonna Give You Up (Official Video) [Remastered 2021]',
    'Rick Astley'
  );
  assert.equal(n2.cleanArtist, 'Rick Astley');
  assert.equal(n2.cleanTitle, 'Never Gonna Give You Up');

  const n3 = normalizeTrackMetadata(
    'Blinding Lights - The Weeknd - Topic',
    'The Weeknd - Topic'
  );
  assert.ok(n3.cleanTitle.includes('Blinding Lights'));
});

test('formatDuration & parseDurationMs: converts time back and forth correctly', () => {
  assert.equal(formatDuration(212000), '3:32');
  assert.equal(formatDuration(355000), '5:55');
  assert.equal(parseDurationMs('3:32'), 212000);
  assert.equal(parseDurationMs('PT3M32S'), 212000);
});

test('tokenSortRatio: achieves >95% similarity despite reversed word order', () => {
  const s1 = 'Bohemian Rhapsody Queen';
  const s2 = 'Queen Bohemian Rhapsody';
  const ratio = tokenSortRatio(s1, s2);
  assert.ok(ratio >= 0.95, `Expected >= 0.95, got ${ratio}`);
});

test('scoreTrackMatch: awards high confidence and duration delta bonus', () => {
  const source: Track = {
    id: 'yt_1',
    title: 'Blinding Lights (Official Video)',
    artist: 'The Weeknd',
    durationMs: 200000,
    source: 'youtube',
  };

  const exactCandidate: Track = {
    id: 'sp_1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    durationMs: 201500, // 1.5s delta
    source: 'spotify',
  };

  const scored = scoreTrackMatch(source, exactCandidate);
  assert.ok(scored.confidence >= 85, `Expected high confidence, got ${scored.confidence}`);
  assert.equal(scored.status, 'high');
  assert.ok(scored.reasons.some((r) => r.includes('duration match')));
});

test('exporters: M3U, CSV, and text parsing generate valid formats', () => {
  const mockTracks: Track[] = [
    {
      id: 't1',
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      durationMs: 294000,
      durationFormatted: '4:54',
      source: 'spotify',
      spotifyUri: 'spotify:track:123',
    },
    {
      id: 't2',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      durationMs: 354000,
      durationFormatted: '5:54',
      source: 'spotify',
      spotifyUri: 'spotify:track:456',
    },
  ];

  const m3u = exportToM3U(mockTracks, 'Classic Hits');
  assert.ok(m3u.includes('#EXTM3U'));
  assert.ok(m3u.includes('#EXTINF:294,Michael Jackson - Billie Jean'));

  const csv = exportToCSV(mockTracks);
  assert.ok(csv.includes('Track Number,Title,Artist,Album'));
  assert.ok(csv.includes('"Billie Jean"'));

  const json = exportToJSON(mockTracks);
  assert.ok(json.includes('"generator": "TubeListiFy"'));

  const parsed = parsePastedTracklist('1. The Beatles - Yesterday\n2. Nirvana - In Bloom');
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].artist, 'The Beatles');
  assert.equal(parsed[0].title, 'Yesterday');
  assert.equal(parsed[1].artist, 'Nirvana');
  assert.equal(parsed[1].title, 'In Bloom');
});

test('formatChartDate: bounds historical dates to valid range', () => {
  assert.equal(formatChartDate('1950-01-01'), '1958-08-04');
  assert.equal(formatChartDate('1985-07-13'), '1985-07-13');
});
