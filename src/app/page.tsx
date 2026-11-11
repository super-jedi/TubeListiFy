'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Navbar, TabType } from '@/components/Navbar';
import { TransferView } from '@/components/TransferView';
import { BillboardTimeCapsuleView } from '@/components/BillboardTimeCapsuleView';
import { GuestExportView } from '@/components/GuestExportView';
import { AuthSettingsView } from '@/components/AuthSettingsView';
import { Track } from '@/types';
import { ExternalLink } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('transfer');
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Cross-tab transfer states
  const [transferredTracks, setTransferredTracks] = useState<Track[] | undefined>(undefined);
  const [transferredTitle, setTransferredTitle] = useState<string | undefined>(undefined);

  const handleTransferBillboardChart = (
    tracks: Track[],
    title: string,
    targetPlatform: 'spotify' | 'youtube'
  ) => {
    setTransferredTracks(tracks);
    setTransferredTitle(title);
    setActiveTab('transfer');
  };

  const handleLoadGuestTracksIntoTransfer = (tracks: Track[], title: string) => {
    setTransferredTracks(tracks);
    setTransferredTitle(title);
    setActiveTab('transfer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-white selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'transfer' && (
          <TransferView
            isDemoMode={isDemoMode}
            initialTracks={transferredTracks}
            initialTitle={transferredTitle}
          />
        )}

        {activeTab === 'billboard' && (
          <BillboardTimeCapsuleView
            onTransferToPlaylist={handleTransferBillboardChart}
          />
        )}

        {activeTab === 'guest' && (
          <GuestExportView
            onLoadIntoTransfer={handleLoadGuestTracksIntoTransfer}
          />
        )}

        {activeTab === 'settings' && (
          <AuthSettingsView
            isDemoMode={isDemoMode}
            onToggleDemoMode={() => setIsDemoMode((prev) => !prev)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-8 mt-auto glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-red-500">Tube</span>
            <span className="font-extrabold text-sm text-emerald-400">ListiFy</span>
            <span>&bull; Unified Playlist Migration & Billboard Time Capsule</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="/plan.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors flex items-center space-x-1"
            >
              <span>Architecture Specs</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span className="text-zinc-600">|</span>

            <span>Designed for Harikrishnan PS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
