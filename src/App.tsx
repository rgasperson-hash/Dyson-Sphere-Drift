/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Joystick } from './components/Joystick';
import { HUD } from './components/HUD';
import { createSpaceship, SpaceshipController } from './game/spaceship';
import { createDysonWorld, DysonWorld } from './game/dysonSphere';
import { sound } from './audio/soundEngine';
import { JoystickInput, CameraViewMode, RadarGemBlip } from './types';

// Pre-allocated math objects to avoid garbage collection inside render loop
const _camIdealPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _tempForward = new THREE.Vector3();

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const joystickInputRef = useRef<JoystickInput>({ x: 0, y: 0, active: false });

  // Game state for React UI
  const [collectedCount, setCollectedCount] = useState(0);
  const [totalGems, setTotalGems] = useState(12);
  const [radarBlips, setRadarBlips] = useState<RadarGemBlip[]>([]);
  const [nearestDist, setNearestDist] = useState<number | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('chase');
  const [isMuted, setIsMuted] = useState(false);

  const cameraModeRef = useRef<CameraViewMode>('chase');
  cameraModeRef.current = cameraMode;

  const handleJoystickChange = useCallback((input: JoystickInput) => {
    joystickInputRef.current = input;
    // Update flight pitch sound
    sound.updateFlightPitch(Math.hypot(input.x, input.y));
  }, []);

  const handleInteractionStart = useCallback(() => {
    sound.init();
  }, []);

  const handleToggleCamera = useCallback(() => {
    sound.init();
    setCameraMode((prev) => {
      if (prev === 'chase') return 'cockpit';
      if (prev === 'cockpit') return 'panoramic';
      return 'chase';
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // -------------------------------------------------------------
    // 1. SOFTWARE WEBGL PROBE & THREE.JS RENDERER SETUP
    // -------------------------------------------------------------
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = false; // Optimize mobile performance

    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------
    // 2. SCENE & CAMERA (Optimized for iPhone portrait view)
    // -------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.0012);

    // Camera with adaptive vertical FOV
    const isPortrait = height > width;
    const camera = new THREE.PerspectiveCamera(isPortrait ? 72 : 60, width / height, 0.2, 2500);

    // Studio Environment for PBR metallic materials
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Ambient Space Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    scene.add(hemiLight);

    // -------------------------------------------------------------
    // 3. BACKGROUND DEEP COSMIC STARFIELD
    // -------------------------------------------------------------
    const starCount = 1600;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xc084fc),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 800 + Math.random() * 800;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // -------------------------------------------------------------
    // 4. DYSON SPHERE WORLD & SPACESHIP INSTANTIATION
    // -------------------------------------------------------------
    const dysonWorld: DysonWorld = createDysonWorld();
    scene.add(dysonWorld.worldGroup);
    setTotalGems(dysonWorld.gems.length);

    const spaceship: SpaceshipController = createSpaceship();
    scene.add(spaceship.group);
    scene.add(spaceship.trailGroup);

    // Initial camera placement behind ship
    camera.position.set(0, 24, 255);
    camera.lookAt(spaceship.group.position);

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------
    // 5. ANIMATION & GAME LOOP
    // -------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameId = 0;
    let radarUpdateTimer = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Read current joystick input
      const { x: steerX, y: steerY } = joystickInputRef.current;

      // Update spaceship flight kinematics (leans into turns)
      const { position: shipPos, forward: shipForward } = spaceship.update(delta, steerX, steerY);

      // Update Dyson sphere world, animate residents & test gem proximity
      const worldEvents = dysonWorld.update(delta, shipPos, elapsedTime);

      // Handle Gem Collection (no popup info window, just pure audio, haptic & flight count)
      if (worldEvents.collectedGem) {
        sound.playGemCollectSound();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(25);
        }
        const collected = dysonWorld.gems.filter((g) => g.collected).length;
        setCollectedCount(collected);
      }

      // Handle Resident Greeting (pure audio, waving in window, no popup info window)
      if (worldEvents.greetedResident) {
        sound.playResidentGreetingSound();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(15);
        }
      }

      // Handle Repulsor Cushion
      if (worldEvents.repulsionVector) {
        // Softly nudge ship position away from barrier
        spaceship.group.position.addScaledVector(worldEvents.repulsionVector, 18.0 * delta);
        spaceship.triggerRepulsorEffect();
        sound.playRepulsorCushionSound();
      }

      // -------------------------------------------------------------
      // LIVE RADAR CALCULATION (Real-time relative gem positions)
      // -------------------------------------------------------------
      radarUpdateTimer += delta;
      if (radarUpdateTimer >= 0.05) {
        radarUpdateTimer = 0;
        const MAX_RADAR_RANGE = 450;
        let minDist = Infinity;

        // Forward vector in horizontal plane
        const fLen = Math.hypot(shipForward.x, shipForward.z) || 1;
        const fx = shipForward.x / fLen;
        const fz = shipForward.z / fLen;

        // Screen right vector in horizontal plane: (-fz, 0, fx)
        const rx = -fz;
        const rz = fx;

        const blips: RadarGemBlip[] = [];

        for (const gem of dysonWorld.gems) {
          if (!gem.collected) {
            const dX = gem.position.x - shipPos.x;
            const dY = gem.position.y - shipPos.y;
            const dZ = gem.position.z - shipPos.z;
            const dist = Math.hypot(dX, dY, dZ);

            if (dist < minDist) {
              minDist = dist;
            }

            // Project delta vector along ship's local forward & right axes
            const distForward = dX * fx + dZ * fz;
            const distRight = dX * rx + dZ * rz;

            let normX = distRight / MAX_RADAR_RANGE;
            let normY = -distForward / MAX_RADAR_RANGE; // -Y is forward (UP) on radar

            const normDist = Math.hypot(normX, normY);
            let isClamped = false;
            if (normDist > 0.92) {
              normX = (normX / normDist) * 0.92;
              normY = (normY / normDist) * 0.92;
              isClamped = true;
            }

            blips.push({
              id: gem.id,
              name: gem.name,
              x: normX,
              y: normY,
              distance: dist,
              elevation: dY,
              isClamped,
              color: '#' + gem.color.toString(16).padStart(6, '0'),
            });
          }
        }

        setRadarBlips(blips);
        setNearestDist(minDist !== Infinity ? minDist : null);
      }

      // -------------------------------------------------------------
      // 6. CAMERA POSITIONING & EXPONENTIAL DAMPING
      // -------------------------------------------------------------
      const activeCameraMode = cameraModeRef.current;
      _tempForward.copy(shipForward);

      if (activeCameraMode === 'cockpit') {
        // Cockpit first-person view
        _camIdealPos.copy(shipPos).addScaledVector(_tempForward, 0.4).add(new THREE.Vector3(0, 0.35, 0));
        camera.position.copy(_camIdealPos);
        _camLookAt.copy(shipPos).addScaledVector(_tempForward, 120);
        camera.lookAt(_camLookAt);
      } else if (activeCameraMode === 'panoramic') {
        // Panoramic wide view
        _camIdealPos.copy(shipPos).addScaledVector(_tempForward, -22).add(new THREE.Vector3(0, 8.5, 0));
        camera.position.lerp(_camIdealPos, 0.12);
        _camLookAt.copy(shipPos).addScaledVector(_tempForward, 35);
        camera.lookAt(_camLookAt);
      } else {
        // Standard third-person chase camera (optimized for iPhone portrait)
        const chaseDistance = isPortrait ? -11.5 : -9.5;
        const chaseHeight = isPortrait ? 3.8 : 3.0;

        _camIdealPos.copy(shipPos).addScaledVector(_tempForward, chaseDistance).add(new THREE.Vector3(0, chaseHeight, 0));

        // Smooth camera follow
        camera.position.lerp(_camIdealPos, 0.16);

        _camLookAt.copy(shipPos).addScaledVector(_tempForward, 25);
        camera.lookAt(_camLookAt);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // -------------------------------------------------------------
    // 7. WINDOW RESIZE HANDLER
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      const portrait = newHeight > newWidth;

      camera.aspect = newWidth / newHeight;
      camera.fov = portrait ? 72 : 60;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Start audio on first user touch anywhere
    const handleFirstGesture = () => {
      sound.init();
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handleFirstGesture);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none touch-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 pointer-events-auto" />

      {/* Minimalist Mobile HUD (Gem counter, live radar, sound/camera controls - NO popup info windows) */}
      <HUD
        collectedCount={collectedCount}
        totalGems={totalGems}
        radarBlips={radarBlips}
        nearestGemDistance={nearestDist}
        cameraMode={cameraMode}
        onToggleCamera={handleToggleCamera}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* 1 Single Joystick in the bottom center */}
      <Joystick onChange={handleJoystickChange} onInteractionStart={handleInteractionStart} />
    </div>
  );
}
