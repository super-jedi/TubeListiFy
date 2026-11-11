export type Platform = 'spotify' | 'youtube' | 'billboard';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  durationFormatted?: string;
  thumbnailUrl?: string;
  originalQuery?: string;
  source: Platform;
  spotifyUri?: string;
  spotifyId?: string;
  youtubeVideoId?: string;
  previewUrl?: string;
  externalUrl?: string;
  rawTitle?: string;
}

export type MatchConfidenceLevel = 'high' | 'medium' | 'low' | 'unmatched' | 'manual';

export interface MatchResult {
  id: string;
  sourceTrack: Track;
  matchedTrack?: Track;
  confidence: number; // 0 - 100
  status: MatchConfidenceLevel;
  reasons: string[];
  alternativeMatches?: Track[];
  selected?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  platform: Platform;
  trackCount: number;
  owner?: string;
  tracks?: Track[];
  externalUrl?: string;
}

export interface BillboardChartItem {
  rank: number;
  title: string;
  artist: string;
  lastWeekRank?: number | null;
  peakRank: number;
  weeksOnChart: number;
  coverUrl?: string;
}

export interface BillboardHistoricalDate {
  date: string; // YYYY-MM-DD
  title: string;
  subtitle: string;
  era: string;
  featuredArtist: string;
}

export type TransferStatus = 'idle' | 'fetching' | 'matching' | 'reviewing' | 'transferring' | 'completed' | 'error';

export interface TransferProgress {
  current: number;
  total: number;
  message: string;
  percent: number;
}

export interface AuthSession {
  spotify: {
    isConnected: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    user?: {
      id: string;
      displayName: string;
      email?: string;
      avatarUrl?: string;
    };
  };
  youtube: {
    isConnected: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    user?: {
      id: string;
      displayName: string;
      email?: string;
      avatarUrl?: string;
    };
  };
  isDemoMode: boolean;
}

export interface ApiSettings {
  spotifyClientId: string;
  spotifyClientSecret: string;
  googleClientId: string;
  googleApiKey: string;
  isDemoMode: boolean;
}
