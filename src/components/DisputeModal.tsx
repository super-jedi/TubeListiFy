'use client';

import React, { useState } from 'react';
import { Track, MatchResult } from '@/types';
import { Search, Check, X, Music, AlertCircle, Loader2 } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchResult: MatchResult | null;
  targetPlatform: 'spotify' | 'youtube';
  onSelectMatch: (matchResultId: string, selectedTrack: Track) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  matchResult,
  targetPlatform,
  onSelectMatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Initialize query from source track when opened
  React.useEffect(() => {
    if (matchResult) {
      const q = `${matchResult.sourceTrack.artist} ${matchResult.sourceTrack.title}`.trim();
      setSearchQuery(q);
      setSearchResults(matchResult.alternativeMatches || []);
      setHasSearched(false);
    }
  }, [matchResult]);

  if (!isOpen || !matchResult) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&platform=${targetPlatform}`);
      const data = await res.json();
      if (data.success && data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChoose = (track: Track) => {
    onSelectMatch(matchResult.id, track);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Dispute Resolution & Alternate Matches</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select or search the precise canonical song on{' '}
              <span className="font-semibold text-emerald-400 capitalize">{targetPlatform}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Source Track Info */}
        <div className="my-4 p-3 bg-zinc-950/60 rounded-xl border border-white/5 flex items-center space-x-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
            {matchResult.sourceTrack.thumbnailUrl ? (
              <img
                src={matchResult.sourceTrack.thumbnailUrl}
                alt={matchResult.sourceTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
              Original {matchResult.sourceTrack.source} Item
            </span>
            <h4 className="text-sm font-semibold text-white truncate">
              {matchResult.sourceTrack.title}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {matchResult.sourceTrack.artist || 'Unknown Artist'} •{' '}
              {matchResult.sourceTrack.durationFormatted || 'Unknown length'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song title, artist, or album..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Search</span>
          </button>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500 space-y-2">
              <AlertCircle className="w-8 h-8 opacity-40" />
              <p className="text-xs">
                {hasSearched
                  ? 'No matching tracks found for this query. Try a broader search.'
                  : 'No alternate candidates pre-loaded. Click search to find tracks.'}
              </p>
            </div>
          ) : (
            searchResults.map((candidate, idx) => {
              const isCurrent = matchResult.matchedTrack?.id === candidate.id;
              return (
                <div
                  key={candidate.id || idx}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-zinc-950/40 border-white/5 hover:border-white/20 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {candidate.thumbnailUrl ? (
                        <img
                          src={candidate.thumbnailUrl}
                          alt={candidate.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-sm font-medium text-white truncate">{candidate.title}</h5>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400">
                            Current Pick
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {candidate.artist} {candidate.album ? `• ${candidate.album}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-xs text-zinc-400 font-mono">
                      {candidate.durationFormatted || ''}
                    </span>
                    <button
                      onClick={() => handleChoose(candidate)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'Selected' : 'Use Match'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
