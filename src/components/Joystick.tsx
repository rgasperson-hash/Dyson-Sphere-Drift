/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { JoystickInput } from '../types';

interface JoystickProps {
  onChange: (input: JoystickInput) => void;
  onInteractionStart?: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onChange, onInteractionStart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const RADIUS = 62; // Maximum travel distance in pixels

  // Helper to process touch or pointer movement
  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;

      const distance = Math.hypot(dx, dy);

      if (distance > RADIUS) {
        dx = (dx / distance) * RADIUS;
        dy = (dy / distance) * RADIUS;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized input: -1 to 1
      const normX = dx / RADIUS;
      const normY = dy / RADIUS;

      onChange({
        x: normX,
        y: normY,
        active: true,
      });
    },
    [onChange, RADIUS]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onInteractionStart?.();
    activePointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsActive(true);

    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isActive || activePointerId.current !== e.pointerId) return;
    e.preventDefault();
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerEnd = (e: React.PointerEvent) => {
    if (activePointerId.current !== e.pointerId && activePointerId.current !== null) return;
    activePointerId.current = null;
    setIsActive(false);
    setKnobPos({ x: 0, y: 0 });
    onChange({ x: 0, y: 0, active: false });
  };

  // Keyboard controls fallback for desktop/browser testing
  useEffect(() => {
    const keysPressed = new Set<string>();

    const updateFromKeys = () => {
      let x = 0;
      let y = 0;

      if (keysPressed.has('ArrowLeft') || keysPressed.has('KeyA')) x -= 1;
      if (keysPressed.has('ArrowRight') || keysPressed.has('KeyD')) x += 1;
      if (keysPressed.has('ArrowUp') || keysPressed.has('KeyW')) y -= 1; // forward/down
      if (keysPressed.has('ArrowDown') || keysPressed.has('KeyS')) y += 1; // backward/up

      if (x !== 0 || y !== 0) {
        onInteractionStart?.();
        setKnobPos({ x: x * (RADIUS * 0.75), y: y * (RADIUS * 0.75) });
        onChange({ x, y, active: true });
      } else if (!isActive) {
        setKnobPos({ x: 0, y: 0 });
        onChange({ x: 0, y: 0, active: false });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        keysPressed.add(e.code);
        updateFromKeys();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (keysPressed.has(e.code)) {
        keysPressed.delete(e.code);
        updateFromKeys();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onChange, isActive, onInteractionStart, RADIUS]);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 select-none touch-none pb-[calc(env(safe-area-inset-bottom,0px))]"
      style={{ touchAction: 'none' }}
    >
      {/* Outer Glow Ring & Base Plate */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className={`relative w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-200 border ${
          isActive
            ? 'bg-sky-950/40 border-cyan-400/60 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
            : 'bg-slate-900/40 border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
        }`}
      >
        {/* Subtle Cardinal Guidance Indicators */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-px h-full bg-linear-to-b from-cyan-400/40 via-transparent to-cyan-400/40" />
          <div className="h-px w-full bg-linear-to-r from-cyan-400/40 via-transparent to-cyan-400/40 absolute" />
        </div>

        {/* Inner concentric ring */}
        <div className="w-24 h-24 rounded-full border border-cyan-500/20 pointer-events-none" />

        {/* Interactive Joystick Thumb Knob */}
        <div
          className={`absolute w-14 h-14 rounded-full border flex items-center justify-center shadow-lg transition-transform ${
            isActive
              ? 'bg-cyan-500/30 border-cyan-300 scale-105 shadow-[0_0_16px_rgba(56,189,248,0.6)]'
              : 'bg-slate-800/80 border-slate-600 shadow-md'
          }`}
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            transition: isActive ? 'none' : 'transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          }}
        >
          {/* Inner metallic jewel center */}
          <div
            className={`w-5 h-5 rounded-full ${
              isActive ? 'bg-cyan-300 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-400'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
