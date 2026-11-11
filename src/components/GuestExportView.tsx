'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileJson,
  ListMusic,
  CheckCircle,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { Track } from '@/types';
import { parsePastedTracklist, exportToCSV, exportToJSON, exportToM3U, downloadFile } from '@/lib/exporters';

interface GuestExportViewProps {
  onLoadIntoTransfer: (tracks: Track[], title: string) => void;
}

export const GuestExportView: React.FC<GuestExportViewProps> = ({ onLoadIntoTransfer }) => {
  const [inputText, setInputText] = useState(`1. Queen - Bohemian Rhapsody
2. Michael Jackson - Billie Jean
3. The Beatles - Hey Jude
4. Nirvana - Smells Like Teen Spirit
5. Eagles - Hotel California
6. David Bowie - Heroes
7. Whitney Houston - I Will Always Love You
8. Fleetwood Mac - Dreams`);

  const [playlistTitle, setPlaylistTitle] = useState('My Curated Tracklist');
  const [parsedTracks, setParsedTracks] = useState<Track[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  React.useEffect(() => {
    const tracks = parsePastedTracklist(inputText);
    setParsedTracks(tracks);
  }, [inputText]);

  const handleDownloadM3U = () => {
    const m3u = exportToM3U(parsedTracks, playlistTitle);
    downloadFile(m3u, `${playlistTitle.replace(/[^\w]/g, '_')}.m3u`, 'audio/x-mpegurl');
  };

  const handleDownloadCSV = () => {
    const csv = exportToCSV(parsedTracks);
    downloadFile(csv, `${playlistTitle.replace(/[^\w]/g, '_')}.csv`, 'text/csv');
  };

  const handleDownloadJSON = () => {
    const json = exportToJSON(parsedTracks, { title: playlistTitle });
    downloadFile(json, `${playlistTitle.replace(/[^\w]/g, '_')}.json`, 'application/json');
  };

  const handleCopyClipboard = (type: 'csv' | 'json' | 'm3u') => {
    let content = '';
    if (type === 'm3u') content = exportToM3U(parsedTracks, playlistTitle);
    if (type === 'csv') content = exportToCSV(parsedTracks);
    if (type === 'json') content = exportToJSON(parsedTracks, { title: playlistTitle });

    navigator.clipboard.writeText(content);
    setCopiedFormat(type);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 font-semibold">
            <Download className="w-3.5 h-3.5" />
            <span>Zero-Authentication Guest Mode & Exporter</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Playlist Converter & File Generator
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Paste any song list or text tracklist, clean the formatting, and immediately export to{' '}
            <span className="text-amber-400 font-semibold">M3U</span>,{' '}
            <span className="text-emerald-400 font-semibold">CSV</span>, or{' '}
            <span className="text-blue-400 font-semibold">JSON</span>—no account login required.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Editor */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Paste Tracklist (Artist - Title)</span>
            </label>
            <span className="text-xs text-zinc-500 font-mono">
              {parsedTracks.length} tracks detected
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={playlistTitle}
              onChange={(e) => setPlaylistTitle(e.target.value)}
              placeholder="Playlist Title"
              className="w-full px-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
            />

            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste tracklist here (e.g. 1. Artist - Song Title)..."
              className="w-full p-4 bg-zinc-950 border border-white/10 rounded-2xl text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => onLoadIntoTransfer(parsedTracks, playlistTitle)}
              disabled={parsedTracks.length === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-emerald-600 hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/10 transition-all"
            >
              <span>Push to Matching Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setInputText('')}
              className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Clear Text
            </button>
          </div>
        </div>

        {/* Right: Instant Export Formats */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Instant File Export Options</span>
            </h3>

            {/* M3U Playlist Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ListMusic className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">M3U / M3U8 Playlist</h4>
                  <p className="text-xs text-zinc-400">
                    Directly importable into VLC, Winamp, Foobar2000, Apple Music
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyClipboard('m3u')}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copy M3U format to clipboard"
                >
                  {copiedFormat === 'm3u' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownloadM3U}
                  disabled={parsedTracks.length === 0}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-bold rounded-xl transition-all"
                >
                  Download .m3u
                </button>
              </div>
            </div>

            {/* CSV Spreadsheet Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">CSV Spreadsheet</h4>
                  <p className="text-xs text-zinc-400">
                    Opens cleanly in Microsoft Excel, Google Sheets, or Notion
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyClipboard('csv')}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copy CSV to clipboard"
                >
                  {copiedFormat === 'csv' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownloadCSV}
                  disabled={parsedTracks.length === 0}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Download .csv
                </button>
              </div>
            </div>

            {/* JSON Schema Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Developer JSON</h4>
                  <p className="text-xs text-zinc-400">
                    Clean structured JSON schema with duration, source, and IDs
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyClipboard('json')}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Copy JSON to clipboard"
                >
                  {copiedFormat === 'json' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownloadJSON}
                  disabled={parsedTracks.length === 0}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Download .json
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 text-[11px] text-zinc-400">
            <span className="font-bold text-white">Privacy Guarantee:</span> Guest exports run 100% in your browser. No playlist or track data is stored on any server.
          </div>
        </div>
      </div>
    </div>
  );
};
