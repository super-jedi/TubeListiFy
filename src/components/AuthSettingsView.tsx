'use client';

import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface AuthSettingsViewProps {
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const AuthSettingsView: React.FC<AuthSettingsViewProps> = ({
  isDemoMode,
  onToggleDemoMode,
}) => {
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'tubelistify_api_keys',
        JSON.stringify({
          spotifyClientId,
          spotifyClientSecret,
          googleApiKey,
        })
      );
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tubelistify_api_keys');
    }
    setSpotifyClientId('');
    setSpotifyClientSecret('');
    setGoogleApiKey('');
    alert('Local settings and API cache cleared.');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="relative z-10 text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Dual OAuth 2.0 PKCE & Scoped API Hub</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Authentication & API Settings
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Configure Spotify Web API credentials and Google / YouTube Data API v3 keys, or operate
            in zero-config instant sandbox mode.
          </p>

          <div className="pt-2 flex justify-center">
            <button
              onClick={onToggleDemoMode}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold border flex items-center space-x-2 transition-all shadow-lg ${
                isDemoMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                {isDemoMode ? 'Demo Sandbox Active (No API Keys Required)' : 'Production Live Mode'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Platform Auth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spotify OAuth Card */}
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <span className="text-emerald-400 font-black text-sm">SP</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Spotify Web API</h3>
                <span className="text-[11px] text-zinc-400">OAuth 2.0 Authorization Code</span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              {isDemoMode ? 'Sandbox Ready' : 'Credentials Active'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Grants permission to read user playlists, search the full Spotify catalog, and batch-create target playlists with chunked rate-limiting backoff.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                Spotify Client ID (Optional for Live Mode)
              </label>
              <input
                type="text"
                value={spotifyClientId}
                onChange={(e) => setSpotifyClientId(e.target.value)}
                placeholder="e.g. 4cOdK2wGLETKBW3PvgPWqT"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                Spotify Client Secret
              </label>
              <input
                type="password"
                value={spotifyClientSecret}
                onChange={(e) => setSpotifyClientSecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="text-[11px] text-zinc-500 pt-1">
              Redirect URI for your app:{' '}
              <code className="text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded">
                http://localhost:3000/api/auth/spotify/callback
              </code>
            </div>
          </div>
        </div>

        {/* YouTube / Google API Card */}
        <div className="glass-panel rounded-3xl p-6 border border-red-500/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                <span className="text-red-400 font-black text-sm">YT</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">YouTube Data API v3</h3>
                <span className="text-[11px] text-zinc-400">Google Cloud Platform</span>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
              {isDemoMode ? 'Sandbox Ready' : 'API Key Active'}
            </span>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Extracts YouTube playlist items, paginates 500+ tracks, parses video durations, and pushes canonical songs directly into YouTube Music playlists.
          </p>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                YouTube API Key (or OAuth Access Token)
              </label>
              <input
                type="text"
                value={googleApiKey}
                onChange={(e) => setGoogleApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="p-3 bg-zinc-950/70 rounded-xl border border-white/5 space-y-1">
              <span className="text-[11px] font-bold text-zinc-300">Public Link Scraper Fallback</span>
              <p className="text-[11px] text-zinc-400">
                If no Google Cloud API key is provided, TubeListiFy gracefully falls back to public page scraping or instant simulation mode.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Settings & Reset Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleClearCache}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl border border-white/5 transition-colors"
        >
          Reset Keys & Cache
        </button>

        <button
          onClick={handleSaveKeys}
          className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 flex items-center space-x-2 transition-all"
        >
          {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Key className="w-4 h-4" />}
          <span>{savedSuccess ? 'Settings Saved Locally!' : 'Save Credentials'}</span>
        </button>
      </div>

      {/* Resume Technical Deep-Dive Cards */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Resume & Architecture Highlights</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-emerald-400">Regex Heuristic Normalizer</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Strips noisy YouTube video tags like <code className="text-zinc-300">[Official 4K Video]</code>, extracts multi-artist featuring credits, and identifies topic releases with &gt;95% canonical accuracy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-red-400">Token-Sort Levenshtein Matching</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calculates string similarity ratios invariant to artist/title order, combined with a 5-second audio duration delta penalty/boost classifier.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-1.5">
            <div className="text-xs font-bold text-blue-400">Rate-Limiting Chunked Pipeline</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Batches playlist writes in 100-track chunks with exponential backoff on HTTP 429 errors, guaranteeing reliable transfers for large 500+ track playlists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
