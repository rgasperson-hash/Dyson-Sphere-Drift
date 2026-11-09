/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Eye } from 'lucide-react';
import { CameraViewMode, RadarGemBlip } from '../types';
import { Radar } from './Radar';

interface HUDProps {
  collectedCount: number;
  totalGems: number;
  radarBlips: RadarGemBlip[];
  nearestGemDistance: number | null;
  cameraMode: CameraViewMode;
  onToggleCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  collectedCount,
  totalGems,
  radarBlips,
  nearestGemDistance,
  cameraMode,
  onToggleCamera,
  isMuted,
  onToggleMute,
}) => {
  const remainingGems = totalGems - collectedCount;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="w-full px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] flex items-start justify-between">
        {/* Top-Left: Sound & Camera controls + Gem Counter */}
        <div className="flex flex-col gap-2 items-start pointer-events-auto">
          {/* Action buttons row */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className="p-2.5 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-200 active:scale-95 transition-transform shadow-md"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX size={18} className="text-slate-400" /> : <Volume2 size={18} className="text-cyan-400" />}
            </button>

            {/* Camera View Mode Switcher */}
            <button
              onClick={onToggleCamera}
              className="p-2.5 rounded-full bg-slate-900/70 border border-slate-700/60 text-slate-200 active:scale-95 transition-transform shadow-md"
              aria-label="Switch Camera View"
            >
              <Eye size={18} className={cameraMode === 'chase' ? 'text-cyan-400' : 'text-amber-400'} />
            </button>
          </div>

          {/* Persistent Gem Flight Counter */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex items-center gap-2 shadow-lg backdrop-blur-xs">
            <span className="text-base drop-shadow-[0_0_6px_#38bdf8]">💎</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Flight Gems</span>
              <span className="text-xs font-semibold tracking-wider text-cyan-200">
                {collectedCount} <span className="text-slate-500 font-normal">/ {totalGems} Captured</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right: Live Radar Window */}
        <div className="pointer-events-auto">
          <Radar
            blips={radarBlips}
            nearestDistance={nearestGemDistance}
            remainingGems={remainingGems}
          />
        </div>
      </header>

      {/* Completely free central view - no pop up info windows as requested */}

      {/* Bottom Spacer for safe joystick clearance */}
      <div className="h-44 pointer-events-none" />
    </div>
  );
};
