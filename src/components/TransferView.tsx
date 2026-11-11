'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeftRight,
  Sparkles,
  Music,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  Search,
  Download,
  ArrowRight,
} from 'lucide-react';
import { Track, MatchResult, Playlist, Platform } from '@/types';
import { DisputeModal } from './DisputeModal';
import { exportToM3U, downloadFile } from '@/lib/exporters';

interface TransferViewProps {
  isDemoMode: boolean;
  onSelectMilestoneChart?: (tracks: Track[], title: string) => void;
  initialTracks?: Track[];
  initialTitle?: string;
}

export const TransferView: React.FC<TransferViewProps> = ({
  isDemoMode,
  initialTracks,
  initialTitle,
}) => {
  const [sourcePlatform, setSourcePlatform] = useState<Platform>('youtube');
  const [targetPlatform, setTargetPlatform] = useState<Platform>('spotify');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Loaded & Matched state
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'review' | 'high' | 'unmatched'>('all');

  // Interactive Dispute Modal state
  const [disputeItem, setDisputeItem] = useState<MatchResult | null>(null);

  // Audio preview state
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Transfer creation state
  const [targetTitle, setTargetTitle] = useState('');
  const [targetDescription, setTargetDescription] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [completedPlaylist, setCompletedPlaylist] = useState<{ id: string; url: string; count: number } | null>(null);

  // Handle external initialization (e.g. from Billboard time machine)
  React.useEffect(() => {
    if (initialTracks && initialTracks.length > 0) {
      const pl: Playlist = {
        id: `billboard_${Date.now()}`,
        title: initialTitle || 'Billboard Chart Playlist',
        description: 'Imported from Billboard Time Capsule',
        platform: 'billboard',
        trackCount: initialTracks.length,
        tracks: initialTracks,
      };
      setPlaylist(pl);
      setTargetTitle(`TubeListiFy • ${pl.title}`);
      handleRunMatching(initialTracks, 'spotify');
    }
  }, [initialTracks, initialTitle]);

  const handleSwapDirection = () => {
    const nextSource = targetPlatform;
    const nextTarget = sourcePlatform === 'billboard' ? 'spotify' : sourcePlatform;
    setSourcePlatform(nextSource);
    setTargetPlatform(nextTarget);
    setPlaylistUrl('');
    setPlaylist(null);
    setMatchResults([]);
    setCompletedPlaylist(null);
  };

  const handleLoadSample = () => {
    if (sourcePlatform === 'youtube') {
      setPlaylistUrl('https://www.youtube.com/playlist?list=PLrAl5KGt2D4x-DemoPopHits');
    } else {
      setPlaylistUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
    }
  };

  const handleFetchPlaylist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setProgressMsg('Step 1/3: Reading playlist metadata & tracks...');
    setCompletedPlaylist(null);

    try {
      const res = await fetch('/api/playlist/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: playlistUrl,
          platform: sourcePlatform,
          isDemo: isDemoMode,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.playlist) {
        throw new Error(data.error || 'Failed to fetch playlist');
      }

      setPlaylist(data.playlist);
      setTargetTitle(`TubeListiFy • ${data.playlist.title}`);
      setTargetDescription(`Migrated from ${sourcePlatform} to ${targetPlatform} via TubeListiFy`);

      // Immediately run matching
      await handleRunMatching(data.playlist.tracks || [], targetPlatform);
    } catch (err: any) {
      alert(`Error loading playlist: ${err.message}`);
    } finally {
      setIsLoading(false);
      setProgressMsg('');
    }
  };

  const handleRunMatching = async (tracks: Track[], target: Platform) => {
    setProgressMsg('Step 2/3: Applying regex noise filters & fuzzy distance scoring...');
    try {
      const matchRes = await fetch('/api/playlist/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks,
          targetPlatform: target === 'billboard' ? 'spotify' : target,
        }),
      });

      const matchData = await matchRes.json();
      if (matchData.success && matchData.results) {
        setMatchResults(matchData.results);
        setAccuracy(matchData.accuracy || 95);
      }
    } catch (err) {
      console.error('Matching failed:', err);
    }
  };

  const handleToggleSelect = (id: string) => {
    setMatchResults((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setMatchResults((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const handleManualSelectMatch = (matchResultId: string, selectedTrack: Track) => {
    setMatchResults((prev) =>
      prev.map((item) => {
        if (item.id === matchResultId) {
          return {
            ...item,
            matchedTrack: selectedTrack,
            status: 'manual',
            confidence: 100,
            reasons: ['User manually verified match'],
            selected: true,
          };
        }
        return item;
      })
    );
  };

  const handlePlayPreview = (track: Track) => {
    if (playingTrackId === track.id) {
      audioElement?.pause();
      setPlayingTrackId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    if (track.previewUrl) {
      const audio = new Audio(track.previewUrl);
      audio.play();
      audio.onended = () => setPlayingTrackId(null);
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    } else if (track.externalUrl) {
      window.open(track.externalUrl, '_blank');
    }
  };

  const handleExecuteTransfer = async () => {
    const selected = matchResults.filter((m) => m.selected && m.matchedTrack);
    if (selected.length === 0) {
      alert('Please select at least one song to transfer.');
      return;
    }

    setIsTransferring(true);
    try {
      const res = await fetch('/api/playlist/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlatform: targetPlatform === 'billboard' ? 'spotify' : targetPlatform,
          title: targetTitle || 'TubeListiFy Playlist',
          description: targetDescription || 'Transferred via TubeListiFy',
          items: matchResults,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Transfer failed');
      }

      setCompletedPlaylist({
        id: data.playlistId,
        url: data.playlistUrl,
        count: data.transferredCount,
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (e) {}
    } catch (err: any) {
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  // Filtered rows
  const filteredMatches = matchResults.filter((item) => {
    if (filterType === 'review') return item.status === 'medium' || item.status === 'low';
    if (filterType === 'high') return item.status === 'high' || item.status === 'manual';
    if (filterType === 'unmatched') return item.status === 'unmatched';
    return true;
  });

  const highCount = matchResults.filter((m) => m.status === 'high' || m.status === 'manual').length;
  const reviewCount = matchResults.filter((m) => m.status === 'medium' || m.status === 'low').length;
  const unmatchedCount = matchResults.filter((m) => m.status === 'unmatched').length;
  const selectedCount = matchResults.filter((m) => m.selected && m.matchedTrack).length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hero Direction & Input Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Driven Regex Normalization & Levenshtein Token Matcher</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Bidirectional Playlist Migration
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Transfer playlists between <span className="text-red-400 font-semibold">YouTube</span> and{' '}
            <span className="text-emerald-400 font-semibold">Spotify</span> with automated noise stripping,
            duration matching, and real-time dispute review.
          </p>

          {/* Direction Switcher Controls */}
          <div className="pt-2 flex items-center justify-center space-x-3 sm:space-x-4">
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border transition-all ${
                sourcePlatform === 'youtube'
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}
            >
              <span className="text-xs uppercase font-bold text-zinc-400">From</span>
              <span className="font-bold text-sm capitalize">{sourcePlatform}</span>
            </div>

            <button
              onClick={handleSwapDirection}
              className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 shadow-md transition-transform hover:scale-110 active:scale-95"
              title="Click to swap source and target direction"
            >
              <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            </button>

            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border transition-all ${
                targetPlatform === 'spotify'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/50 text-red-300'
              }`}
            >
              <span className="text-xs uppercase font-bold text-zinc-400">To</span>
              <span className="font-bold text-sm capitalize">{targetPlatform}</span>
            </div>
          </div>

          {/* Search / URL Input Form */}
          <form onSubmit={handleFetchPlaylist} className="pt-4 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <Music className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder={
                    sourcePlatform === 'youtube'
                      ? 'Paste YouTube playlist link or ID (e.g. https://www.youtube.com/playlist?list=...)'
                      : 'Paste Spotify playlist link or ID (e.g. https://open.spotify.com/playlist/...)'
                  }
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950/90 border border-white/15 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                />
              </div>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white text-sm font-bold rounded-2xl shadow-lg shadow-red-600/20 flex items-center justify-center space-x-2 transition-all flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Processing...' : 'Analyze & Match'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3.5 py-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-2xl border border-white/10 whitespace-nowrap transition-colors"
                  title="Load real-world messy sample playlist"
                >
                  Sample Link
                </button>
              </div>
            </div>

            {progressMsg && (
              <p className="text-xs text-emerald-400 font-mono mt-3 animate-pulse">
                {progressMsg}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Success Celebration Card (if transfer completed) */}
      {completedPlaylist && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 bg-emerald-950/20 shadow-2xl animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Transfer Successful!
                </span>
                <h3 className="text-xl font-black text-white">
                  {completedPlaylist.count} Tracks Synchronized to {targetPlatform}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Your new playlist is created, populated, and ready for streaming.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={completedPlaylist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <span>Open in {targetPlatform}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  const m3u = exportToM3U(matchResults.map((m) => m.matchedTrack || m.sourceTrack), targetTitle);
                  downloadFile(m3u, `${targetTitle.replace(/[^\w]/g, '_')}.m3u`, 'audio/x-mpegurl');
                }}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-white/10 flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>M3U File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Matching Dashboard */}
      {matchResults.length > 0 && (
        <div className="space-y-6 animate-slide-up">
          {/* Header Stats & Filter Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Total Tracks
              </span>
              <div className="text-2xl font-black text-white mt-1">{matchResults.length}</div>
              <span className="text-[10px] text-zinc-500">From {sourcePlatform} playlist</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Match Accuracy
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{accuracy}%</div>
              <span className="text-[10px] text-zinc-500">Fuzzy Levenshtein ratio</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                High Confidence
              </span>
              <div className="text-2xl font-black text-emerald-300 mt-1">{highCount}</div>
              <span className="text-[10px] text-zinc-500">&ge; 85% confidence score</span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Needs Review
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">{reviewCount}</div>
              <span className="text-[10px] text-zinc-500">Interactive dispute ready</span>
            </div>
          </div>

          {/* Table Header Filter Tabs */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-white text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  All ({matchResults.length})
                </button>
                <button
                  onClick={() => setFilterType('review')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    filterType === 'review'
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Needs Review ({reviewCount})</span>
                </button>
                <button
                  onClick={() => setFilterType('high')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterType === 'high'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  High Confidence ({highCount})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSelectAll(true)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                >
                  Select All
                </button>
                <span className="text-zinc-600">|</span>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-white/5"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Matched Tracks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">Sync</th>
                    <th className="py-3 px-3">Original Source Track</th>
                    <th className="py-3 px-3 text-center">Confidence</th>
                    <th className="py-3 px-3">Target Platform Match</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredMatches.map((item) => {
                    const src = item.sourceTrack;
                    const matched = item.matchedTrack;
                    const isHigh = item.status === 'high' || item.status === 'manual';
                    const isMed = item.status === 'medium';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          !item.selected ? 'opacity-40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(item.selected)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Source Track Details */}
                        <td className="py-3 px-3 max-w-xs sm:max-w-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {src.thumbnailUrl ? (
                                <img
                                  src={src.thumbnailUrl}
                                  alt={src.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Music className="w-4 h-4 text-zinc-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-sm font-semibold text-white truncate" title={src.rawTitle || src.title}>
                                {src.title}
                              </h4>
                              <p className="text-xs text-zinc-400 truncate">
                                {src.artist || 'Unknown Artist'}{' '}
                                {src.durationFormatted && (
                                  <span className="font-mono text-[11px] text-zinc-500">
                                    • {src.durationFormatted}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Confidence Badge */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isHigh
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : isMed
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
                              }`}
                              title={item.reasons.join('\n')}
                            >
                              {item.status === 'manual' ? 'Verified 100%' : `${item.confidence}% Match`}
                            </span>
                            {item.reasons[0] && (
                              <span className="text-[9px] text-zinc-500 mt-1 max-w-[120px] truncate">
                                {item.reasons[0]}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Matched Track on Destination Platform */}
                        <td className="py-3 px-3 max-w-xs sm:max-w-sm">
                          {matched ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {matched.thumbnailUrl ? (
                                  <img
                                    src={matched.thumbnailUrl}
                                    alt={matched.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Music className="w-4 h-4 text-zinc-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">
                                  {matched.title}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate">
                                  {matched.artist}{' '}
                                  {matched.album && (
                                    <span className="text-zinc-500">• {matched.album}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-red-400 italic">No match found</span>
                          )}
                        </td>

                        {/* Actions: Audio preview & dispute search */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {matched && (
                              <button
                                onClick={() => handlePlayPreview(matched)}
                                className={`p-2 rounded-lg border transition-colors ${
                                  playingTrackId === matched.id
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/5'
                                }`}
                                title={
                                  matched.previewUrl
                                    ? 'Listen to 30s Audio Preview'
                                    : 'Open song on streaming service'
                                }
                              >
                                {playingTrackId === matched.id ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => setDisputeItem(item)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center space-x-1 transition-colors"
                              title="Resolve dispute or pick alternate match"
                            >
                              <Search className="w-3 h-3" />
                              <span className="hidden sm:inline">Dispute</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Transfer Playlist Creation Panel */}
            <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-1/2 space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Target Playlist Title:
                </label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="Target Playlist Title"
                  className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                <button
                  onClick={handleExecuteTransfer}
                  disabled={isTransferring || selectedCount === 0}
                  className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  {isTransferring ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {isTransferring
                      ? 'Creating & Batch Syncing...'
                      : `Transfer ${selectedCount} Songs to ${targetPlatform}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Search & Dispute Resolution Modal */}
      <DisputeModal
        isOpen={Boolean(disputeItem)}
        onClose={() => setDisputeItem(null)}
        matchResult={disputeItem}
        targetPlatform={targetPlatform === 'billboard' ? 'spotify' : targetPlatform}
        onSelectMatch={handleManualSelectMatch}
      />
    </div>
  );
};
