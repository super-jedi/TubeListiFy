import { Track, MatchConfidenceLevel, MatchResult } from '../../types';
import { normalizeTrackMetadata } from './normalizer';

/**
 * Standard Levenshtein Distance implementation
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Similarity ratio between 0.0 and 1.0 using Levenshtein distance
 */
export function stringSimilarityRatio(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Tokenize and sort string for token-sort ratio calculation
 */
export function tokenSortString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ');
}

export function tokenSortRatio(s1: string, s2: string): number {
  const sorted1 = tokenSortString(s1);
  const sorted2 = tokenSortString(s2);
  return stringSimilarityRatio(sorted1, sorted2);
}

/**
 * Compare two tracks and compute match confidence, delta, and diagnostic reasons.
 */
export function scoreTrackMatch(source: Track, candidate: Track): {
  confidence: number;
  status: MatchConfidenceLevel;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Normalize source metadata
  const normSource = normalizeTrackMetadata(source.title, source.artist);
  const sourceTitleClean = normSource.cleanTitle.toLowerCase();
  const sourceArtistClean = (normSource.cleanArtist || source.artist).toLowerCase();

  const candidateTitle = candidate.title.toLowerCase();
  const candidateArtist = candidate.artist.toLowerCase();

  // 1. Direct title similarity
  const directTitleSim = stringSimilarityRatio(sourceTitleClean, candidateTitle);
  const tokenSortTitleSim = tokenSortRatio(sourceTitleClean, candidateTitle);
  const bestTitleSim = Math.max(directTitleSim, tokenSortTitleSim);

  // 2. Artist similarity
  let artistSim = 0.5; // neutral if artist unknown
  if (sourceArtistClean && candidateArtist) {
    const directArtistSim = stringSimilarityRatio(sourceArtistClean, candidateArtist);
    const tokenSortArtistSim = tokenSortRatio(sourceArtistClean, candidateArtist);
    const containsArtist = candidateArtist.includes(sourceArtistClean) || sourceArtistClean.includes(candidateArtist);
    artistSim = Math.max(directArtistSim, tokenSortArtistSim, containsArtist ? 0.9 : 0);
  }

  // Weight: 60% Title, 40% Artist
  let rawScore = (bestTitleSim * 0.6) + (artistSim * 0.4);

  if (bestTitleSim > 0.95) {
    reasons.push('Title string matches closely (>95%)');
  } else if (tokenSortTitleSim > 0.85) {
    reasons.push(`Token-sort alignment (${Math.round(tokenSortTitleSim * 100)}%)`);
  }

  if (artistSim > 0.85) {
    reasons.push('Artist name strongly verified');
  } else if (artistSim < 0.4 && sourceArtistClean) {
    reasons.push('Artist name variance detected');
  }

  // 3. Duration comparison check (if both tracks have duration)
  if (source.durationMs && candidate.durationMs) {
    const deltaSeconds = Math.abs(source.durationMs - candidate.durationMs) / 1000;
    if (deltaSeconds <= 3) {
      rawScore += 0.12; // High confidence boost for identical audio length
      reasons.push(`Exact audio duration match (delta: ${deltaSeconds.toFixed(1)}s)`);
    } else if (deltaSeconds <= 7) {
      rawScore += 0.06;
      reasons.push(`Audio duration near match (delta: ${deltaSeconds.toFixed(1)}s)`);
    } else if (deltaSeconds > 45) {
      rawScore -= 0.20; // Likely live version, extended mix, or remix
      reasons.push(`Significant duration disparity (${deltaSeconds.toFixed(0)}s delta)`);
    }
  }

  // Normalize confidence percentage between 0 and 100
  const finalConfidence = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

  // Classify confidence level
  let status: MatchConfidenceLevel = 'unmatched';
  if (finalConfidence >= 85) {
    status = 'high';
  } else if (finalConfidence >= 70) {
    status = 'medium';
  } else if (finalConfidence >= 40) {
    status = 'low';
  } else {
    status = 'unmatched';
  }

  return {
    confidence: finalConfidence,
    status,
    reasons,
  };
}

/**
 * Match a source track against an array of candidate matches from target platform
 */
export function findBestMatch(source: Track, candidates: Track[]): MatchResult {
  if (!candidates || candidates.length === 0) {
    return {
      id: `match_${source.id}`,
      sourceTrack: source,
      matchedTrack: undefined,
      confidence: 0,
      status: 'unmatched',
      reasons: ['No search results returned from target platform'],
      alternativeMatches: [],
      selected: false,
    };
  }

  // Score all candidates
  const scoredCandidates = candidates.map((candidate) => {
    const score = scoreTrackMatch(source, candidate);
    return {
      candidate,
      ...score,
    };
  });

  // Sort descending by confidence
  scoredCandidates.sort((a, b) => b.confidence - a.confidence);

  const best = scoredCandidates[0];
  const alternatives = scoredCandidates.slice(1, 4).map((c) => c.candidate);

  return {
    id: `match_${source.id}`,
    sourceTrack: source,
    matchedTrack: best.candidate,
    confidence: best.confidence,
    status: best.status,
    reasons: best.reasons,
    alternativeMatches: alternatives,
    selected: best.status === 'high' || best.status === 'medium',
  };
}
