'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeftRight, Clock, Download, Settings, Sparkles, ExternalLink } from 'lucide-react';

export type TabType = 'transfer' | 'billboard' | 'guest' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isDemoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('transfer')}>
          <div className="relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-tr from-red-600 via-zinc-800 to-emerald-500 p-[1.5px] shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="TubeListiFy Logo"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-xl tracking-tight text-red-500">Tube</span>
              <span className="font-extrabold text-xl tracking-tight text-emerald-400">ListiFy</span>
            </div>
            <span className="text-[10px] font-medium text-zinc-400 tracking-wider -mt-1 uppercase">
              Cross-Platform Playlist Engine
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => onTabChange('transfer')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'transfer'
                ? 'bg-gradient-to-r from-red-500/20 to-emerald-500/20 text-white border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-red-400" />
            <span>Playlist Transfer</span>
          </button>

          <button
            onClick={() => onTabChange('billboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'billboard'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border border-white/10 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Billboard Time Capsule</span>
          </button>

          <button
            onClick={() => onTabChange('guest')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'guest'
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export & Guest</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>Auth & APIs</span>
          </button>
        </nav>

        {/* Demo Mode & Quick Action Badges */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onToggleDemoMode}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              isDemoMode
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
            }`}
            title="Toggle between instant Demo mode and live authenticated API mode"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{isDemoMode ? 'Demo Sandbox Active' : 'Live API Mode'}</span>
          </button>

          <a
            href="/plan.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-white/5 hover:border-white/15 transition-colors"
          >
            <span>Specs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="flex md:hidden px-4 pb-2 pt-1 border-t border-white/5 overflow-x-auto space-x-1">
        <button
          onClick={() => onTabChange('transfer')}
          className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'transfer' ? 'bg-red-500/20 text-white' : 'text-zinc-400'
          }`}
        >
          Transfer
        </button>
        <button
          onClick={() => onTabChange('billboard')}
          className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'billboard' ? 'bg-emerald-500/20 text-white' : 'text-zinc-400'
          }`}
        >
          Billboard Time Capsule
        </button>
        <button
          onClick={() => onTabChange('guest')}
          className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'guest' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          Export
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`px-3 py-1 text-xs rounded-md whitespace-nowrap ${
            activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
          }`}
        >
          Settings
        </button>
      </div>
    </header>
  );
};
