'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Sparkles,
  Download,
  Music,
  Play,
  Loader2,
} from 'lucide-react';
import { BillboardChartItem, BillboardHistoricalDate, Track } from '@/types';
import { HISTORICAL_MILESTONES } from '@/lib/billboard/milestones';
import { exportToCSV, exportToJSON, exportToM3U, downloadFile } from '@/lib/exporters';

interface BillboardTimeCapsuleViewProps {
  onTransferToPlaylist: (tracks: Track[], title: string, platform: 'spotify' | 'youtube') => void;
}

export const BillboardTimeCapsuleView: React.FC<BillboardTimeCapsuleViewProps> = ({
  onTransferToPlaylist,
}) => {
  const [selectedDate, setSelectedDate] = useState('1985-07-13'); // Default to iconic Live Aid date
  const [currentChartDate, setCurrentChartDate] = useState('1985-07-13');
  const [chartItems, setChartItems] = useState<BillboardChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limit, setLimit] = useState(25);
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'fallback'>('fallback');

  const fetchChart = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/billboard?date=${dateStr}&limit=${limit}`);
      const data = await res.json();
      if (data.success && data.items) {
        setChartItems(data.items);
        setCurrentChartDate(data.date);
        setDataSource(data.source || 'cache');
      }
    } catch (err) {
      console.error('Failed to load Billboard chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChart(selectedDate);
  }, []);

  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChart(selectedDate);
  };

  const handleSelectMilestone = (milestone: BillboardHistoricalDate) => {
    setSelectedDate(milestone.date);
    fetchChart(milestone.date);
  };

  const convertChartItemsToTracks = (items: BillboardChartItem[]): Track[] => {
    return items.map((item, idx) => ({
      id: `billboard_${idx + 1}`,
      title: item.title,
      artist: item.artist,
      source: 'billboard',
      thumbnailUrl: item.coverUrl,
      externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.artist + ' ' + item.title)}`,
    }));
  };

  const handleTransferClick = (targetPlatform: 'spotify' | 'youtube') => {
    const tracks = convertChartItemsToTracks(chartItems);
    const title = `Billboard Hot 100 • ${currentChartDate}`;
    onTransferToPlaylist(tracks, title, targetPlatform);
  };

  const handleExportM3U = () => {
    const tracks = convertChartItemsToTracks(chartItems);
    const m3u = exportToM3U(tracks, `Billboard Hot 100 - ${currentChartDate}`);
    downloadFile(m3u, `Billboard_Hot_100_${currentChartDate}.m3u`, 'audio/x-mpegurl');
  };

  const handleExportCSV = () => {
    const tracks = convertChartItemsToTracks(chartItems);
    const csv = exportToCSV(tracks);
    downloadFile(csv, `Billboard_Hot_100_${currentChartDate}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const tracks = convertChartItemsToTracks(chartItems);
    const json = exportToJSON(tracks, { chartDate: currentChartDate, source: 'Billboard Hot 100' });
    downloadFile(json, `Billboard_Hot_100_${currentChartDate}.json`, 'application/json');
  };

  // Find active milestone metadata if any
  const currentMilestone = HISTORICAL_MILESTONES.find((m) => m.date === currentChartDate);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Time Machine Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Billboard Hot 100 Historical Archives (1958 – Present)</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Musical Time Capsule
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Travel back to any week in modern music history. Discover what was playing on the radio,
            relive iconic cultural moments, and turn historical charts into modern streaming playlists.
          </p>

          {/* Date Picker Form */}
          <form onSubmit={handleDateSubmit} className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
            <div className="relative w-full sm:w-auto flex-1">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                min="1958-08-04"
                max={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-white/15 rounded-2xl text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors shadow-inner cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all flex-shrink-0"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Time Travel</span>
            </button>
          </form>
        </div>
      </div>

      {/* Historical Milestones Carousel / Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Iconic Musical Milestones</span>
          </span>
          <span className="text-[11px] text-zinc-500">Click any era to jump in time</span>
        </div>

        <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {HISTORICAL_MILESTONES.map((m) => {
            const isSelected = m.date === currentChartDate;
            return (
              <button
                key={m.date}
                onClick={() => handleSelectMilestone(m)}
                className={`p-3 rounded-2xl border text-left flex-shrink-0 w-56 transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-950/60 to-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10 scale-102'
                    : 'bg-zinc-900/60 border-white/5 hover:border-white/20 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-1">
                  <span className="text-emerald-400 font-mono">{m.date}</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5">{m.era}</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
                  {m.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Results Header & Playlist Conversion Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                Billboard Hot 100 Chart
              </span>
              <span className="text-xs font-mono text-zinc-400">{currentChartDate}</span>
              {dataSource === 'cache' && (
                <span className="text-[10px] text-zinc-500">Cached archive</span>
              )}
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              {currentMilestone ? currentMilestone.title : `Top Songs of the Week`}
            </h3>
            <p className="text-xs text-zinc-400">
              {currentMilestone ? currentMilestone.subtitle : `The 100 most popular songs in the United States on ${currentChartDate}.`}
            </p>
          </div>

          {/* Conversion to Spotify / YouTube Playlists */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTransferClick('spotify')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Convert to Spotify</span>
            </button>

            <button
              onClick={() => handleTransferClick('youtube')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-red-600/20 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Convert to YouTube</span>
            </button>

            <div className="flex items-center space-x-1 border-l border-white/10 pl-2">
              <button
                onClick={handleExportM3U}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-white/5 transition-colors"
                title="Download M3U Playlist File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-white/5 transition-colors"
                title="Export as CSV Spreadsheet"
              >
                CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl border border-white/5 transition-colors"
                title="Export as JSON"
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Songs List */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-zinc-400">
              Fetching historical chart from Billboard archives...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-16 text-center">Rank</th>
                  <th className="py-2.5 px-3">Song & Artist</th>
                  <th className="py-2.5 px-3 text-center">Peak</th>
                  <th className="py-2.5 px-3 text-center">Weeks</th>
                  <th className="py-2.5 px-3 text-right">Quick Listen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {chartItems.slice(0, limit).map((item) => {
                  const isTopOne = item.rank === 1;
                  const isTopTen = item.rank <= 10;

                  return (
                    <tr
                      key={item.rank}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Rank Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${
                            isTopOne
                              ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                              : isTopTen
                              ? 'bg-zinc-800 text-white font-bold'
                              : 'text-zinc-400'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>

                      {/* Song Title & Artist */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.coverUrl ? (
                              <img
                                src={item.coverUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music className="w-4 h-4 text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">
                              {item.title}
                            </h4>
                            <p className="text-xs text-zinc-400">{item.artist}</p>
                          </div>
                        </div>
                      </td>

                      {/* Peak Rank */}
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-mono text-zinc-400">
                          #{item.peakRank}
                        </span>
                      </td>

                      {/* Weeks on Chart */}
                      <td className="py-3 px-3 text-center">
                        <span className="text-xs font-mono text-zinc-400">
                          {item.weeksOnChart} wks
                        </span>
                      </td>

                      {/* Search / Play Link */}
                      <td className="py-3 px-3 text-right">
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.artist + ' ' + item.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 text-xs font-semibold border border-white/5 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>YouTube</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
