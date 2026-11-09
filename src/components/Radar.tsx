/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RadarGemBlip } from '../types';

interface RadarProps {
  blips: RadarGemBlip[];
  nearestDistance: number | null;
  remainingGems: number;
}

export const Radar: React.FC<RadarProps> = ({ blips, nearestDistance, remainingGems }) => {
  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      {/* Radar Scope Container */}
      <div className="relative w-28 h-28 rounded-full bg-slate-950/85 border-2 border-cyan-500/40 shadow-[0_0_18px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Subtle grid concentric range rings */}
        {/* Outer 450m (ring edge) */}
        {/* Middle 225m ring */}
        <div className="absolute inset-3 rounded-full border border-cyan-500/20 pointer-events-none" />
        {/* Inner 100m ring */}
        <div className="absolute inset-7 rounded-full border border-dashed border-cyan-500/25 pointer-events-none" />

        {/* Crosshair guide lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-px bg-cyan-500/20" />
          <div className="h-full w-px bg-cyan-500/20 absolute" />
        </div>

        {/* Faint rotating radar sweep line */}
        <div className="absolute inset-0 rounded-full pointer-events-none animate-[spin_4s_linear_infinite] origin-center opacity-40">
          <div
            className="w-1/2 h-1/2 origin-bottom-right"
            style={{
              background: 'conic-gradient(from 0deg, rgba(34,211,238,0.4) 0deg, transparent 60deg)',
            }}
          />
        </div>

        {/* Center Ship Marker (always pointing forward/up) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 flex items-center justify-center">
            {/* Triangular ship chevron */}
            <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 fill-cyan-300 drop-shadow-[0_0_4px_#38bdf8]">
              <path d="M 6 0 L 11 11 L 6 8.5 L 1 11 Z" />
            </svg>
          </div>
        </div>

        {/* Dynamic Gem Blips */}
        {blips.map((blip) => {
          // Map x, y (-1 to 1) to percentage inside the radar
          // Center is 50%, 50%. Radius of radar boundary is 44% to leave padding
          const leftPercent = 50 + blip.x * 43;
          const topPercent = 50 + blip.y * 43;

          return (
            <div
              key={blip.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-75"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
              }}
              title={`${blip.name}: ${Math.round(blip.distance)}m`}
            >
              {blip.isClamped ? (
                // Clamped on the radar edge (distant gem)
                <div
                  className="w-2 h-2 rotate-45 border border-cyan-300 bg-cyan-400 shadow-[0_0_6px_#22d3ee] opacity-80"
                  style={{ backgroundColor: blip.color }}
                />
              ) : (
                // Active gem in range
                <div className="relative flex items-center justify-center">
                  {/* Subtle pulsing halo */}
                  <div
                    className="absolute w-3.5 h-3.5 rounded-full opacity-40 animate-ping"
                    style={{ backgroundColor: blip.color }}
                  />
                  {/* Diamond crystal blip */}
                  <div
                    className="w-2.5 h-2.5 rotate-45 shadow-[0_0_8px_rgba(56,189,248,0.9)] border border-white/60"
                    style={{ backgroundColor: blip.color }}
                  />
                  {/* Elevation indicator pip */}
                  {blip.elevation > 18 && (
                    <span className="absolute -top-2.5 text-[8px] font-bold text-cyan-200 leading-none">▲</span>
                  )}
                  {blip.elevation < -18 && (
                    <span className="absolute -bottom-2.5 text-[8px] font-bold text-cyan-200 leading-none">▼</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mini Radar Subtitle info */}
      <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono text-cyan-300 tracking-wider shadow">
        {remainingGems > 0 ? (
          nearestDistance !== null ? (
            <span>RADAR: {Math.round(nearestDistance)}m</span>
          ) : (
            <span>RADAR ACTIVE</span>
          )
        ) : (
          <span className="text-amber-300 font-semibold">ALL GEMS FOUND</span>
        )}
      </div>
    </div>
  );
};
