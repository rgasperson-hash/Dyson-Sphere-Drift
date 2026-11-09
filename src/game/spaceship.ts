/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface SpaceshipController {
  group: THREE.Group;
  trailGroup: THREE.Points;
  update: (delta: number, steerX: number, steerY: number) => { position: THREE.Vector3; forward: THREE.Vector3 };
  triggerRepulsorEffect: () => void;
  resetPosition: (pos: THREE.Vector3, target: THREE.Vector3) => void;
}

export function createSpaceship(): SpaceshipController {
  const shipGroup = new THREE.Group();

  // Materials
  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xebf2fa,
    roughness: 0.25,
    metalness: 0.8,
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Vibrant cyan accent
    roughness: 0.3,
    metalness: 0.6,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.85,
  });

  const canopyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    metalness: 0.1,
    roughness: 0.08,
    transmission: 0.7,
    transparent: true,
    opacity: 0.85,
    ior: 1.5,
  });

  const engineGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });

  const beaconCyanMaterial = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const beaconAmberMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  // 1. Fuselage Core (Sleek elongated diamond fuselage)
  const fuselageGeo = new THREE.ConeGeometry(0.75, 4.2, 5);
  fuselageGeo.rotateX(Math.PI / 2);
  fuselageGeo.scale(1.2, 0.45, 1);
  const fuselage = new THREE.Mesh(fuselageGeo, hullMaterial);
  fuselage.position.set(0, 0, 0.2);
  shipGroup.add(fuselage);

  // Dorsal Spine
  const spineGeo = new THREE.BoxGeometry(0.2, 0.22, 2.8);
  const spine = new THREE.Mesh(spineGeo, accentMaterial);
  spine.position.set(0, 0.28, -0.2);
  shipGroup.add(spine);

  // 2. Cockpit Canopy Bubble
  const canopyGeo = new THREE.SphereGeometry(0.42, 16, 12);
  canopyGeo.scale(0.85, 0.7, 2.2);
  const canopy = new THREE.Mesh(canopyGeo, canopyMaterial);
  canopy.position.set(0, 0.25, 0.4);
  shipGroup.add(canopy);

  // Pilot miniature silhouette inside canopy
  const pilotHeadGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const pilotMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const pilot = new THREE.Mesh(pilotHeadGeo, pilotMat);
  pilot.position.set(0, 0.26, 0.35);
  shipGroup.add(pilot);

  // 3. Swept Delta Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.2, -1.2);
  wingShape.lineTo(3.1, -1.6);
  wingShape.lineTo(0.5, -1.8);
  wingShape.lineTo(0, -1.7);
  wingShape.closePath();

  const wingExtrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  };

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
  wingGeo.rotateX(-Math.PI / 2);

  // Right Wing
  const rightWing = new THREE.Mesh(wingGeo, hullMaterial);
  rightWing.position.set(0.2, 0, 0.2);
  shipGroup.add(rightWing);

  // Left Wing (mirrored)
  const leftWingGeo = wingGeo.clone();
  leftWingGeo.scale(-1, 1, 1);
  const leftWing = new THREE.Mesh(leftWingGeo, hullMaterial);
  leftWing.position.set(-0.2, 0, 0.2);
  shipGroup.add(leftWing);

  // Wingtip winglets
  const wingletGeo = new THREE.BoxGeometry(0.06, 0.45, 0.6);
  const rightWinglet = new THREE.Mesh(wingletGeo, accentMaterial);
  rightWinglet.position.set(3.25, 0.18, -1.2);
  shipGroup.add(rightWinglet);

  const leftWinglet = new THREE.Mesh(wingletGeo, accentMaterial);
  leftWinglet.position.set(-3.25, 0.18, -1.2);
  shipGroup.add(leftWinglet);

  // Wingtip Nav Beacons
  const beaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const leftBeacon = new THREE.Mesh(beaconGeo, beaconCyanMaterial);
  leftBeacon.position.set(-3.26, 0.42, -1.2);
  shipGroup.add(leftBeacon);

  const rightBeacon = new THREE.Mesh(beaconGeo, beaconAmberMaterial);
  rightBeacon.position.set(3.26, 0.42, -1.2);
  shipGroup.add(rightBeacon);

  // 4. Twin Ion Engine Nacelles
  const engineNacelleGeo = new THREE.CylinderGeometry(0.26, 0.32, 1.4, 12);
  engineNacelleGeo.rotateX(Math.PI / 2);

  const leftNacelle = new THREE.Mesh(engineNacelleGeo, darkTrimMaterial);
  leftNacelle.position.set(-0.7, 0.05, -1.4);
  shipGroup.add(leftNacelle);

  const rightNacelle = new THREE.Mesh(engineNacelleGeo, darkTrimMaterial);
  rightNacelle.position.set(0.7, 0.05, -1.4);
  shipGroup.add(rightNacelle);

  // Engine Plasma Plumes
  const plumeGeo = new THREE.ConeGeometry(0.22, 0.9, 12);
  plumeGeo.rotateX(-Math.PI / 2);

  const leftPlume = new THREE.Mesh(plumeGeo, engineGlowMaterial);
  leftPlume.position.set(-0.7, 0.05, -2.4);
  shipGroup.add(leftPlume);

  const rightPlume = new THREE.Mesh(plumeGeo, engineGlowMaterial);
  rightPlume.position.set(0.7, 0.05, -2.4);
  shipGroup.add(rightPlume);

  // 5. Shield Repulsor Sphere (invisible until contact/cushion)
  const shieldGeo = new THREE.SphereGeometry(2.4, 16, 12);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    wireframe: true,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shipGroup.add(shieldMesh);

  // 6. Particle Trail System (Ion engine particles)
  const TRAIL_COUNT = 80;
  const trailPositions = new Float32Array(TRAIL_COUNT * 3);
  const trailOpacities = new Float32Array(TRAIL_COUNT);
  const trailAges = new Float32Array(TRAIL_COUNT);

  // Initialize off-screen
  for (let i = 0; i < TRAIL_COUNT; i++) {
    trailPositions[i * 3] = 0;
    trailPositions[i * 3 + 1] = 0;
    trailPositions[i * 3 + 2] = -9999;
    trailOpacities[i] = 0;
    trailAges[i] = i / TRAIL_COUNT;
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

  const trailMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const trailPoints = new THREE.Points(trailGeo, trailMat);

  // Kinematic state
  const CONSTANT_SPEED = 32.0; // Serene, majestic cruising speed
  let currentPitch = 0;
  let currentYaw = 0;
  let currentRoll = 0;
  let shieldPulse = 0;

  let trailHead = 0;
  let trailTimer = 0;

  // Initial position in the vast Dyson inner space
  shipGroup.position.set(0, 20, 240);
  shipGroup.rotation.order = 'YXZ';

  function update(delta: number, steerX: number, steerY: number) {
    // Steer responsiveness with physical momentum
    const targetTurnRateYaw = -steerX * 1.35; // Turn left/right
    const targetTurnRatePitch = steerY * 1.15; // Pull up / dive down
    const targetBankRoll = steerX * 0.75; // Leaning into the turns with aerodynamic banking

    currentYaw += targetTurnRateYaw * delta;
    currentPitch = THREE.MathUtils.damp(currentPitch, targetTurnRatePitch, 4.0, delta);
    currentRoll = THREE.MathUtils.damp(currentRoll, targetBankRoll, 5.0, delta);

    // Apply orientation
    shipGroup.rotation.y = currentYaw;
    shipGroup.rotation.x = currentPitch;
    shipGroup.rotation.z = currentRoll;

    // Plume dynamic pulsing and steering flare
    const pulseScale = 0.9 + Math.sin(Date.now() * 0.015) * 0.15 + Math.abs(steerX) * 0.25;
    leftPlume.scale.set(1, 1, pulseScale);
    rightPlume.scale.set(1, 1, pulseScale);

    // Forward motion vector along ship's local forward (+Z in Three.js when rotated or custom forward)
    // Here our ship model points towards +Z forward
    const forwardDir = new THREE.Vector3(0, 0, 1).applyEuler(shipGroup.rotation).normalize();

    // Move forward at constant speed
    shipGroup.position.addScaledVector(forwardDir, CONSTANT_SPEED * delta);

    // Repulsor shield visual animation
    if (shieldPulse > 0) {
      shieldPulse -= delta * 2.5;
      shieldMat.opacity = Math.max(0, shieldPulse * 0.45);
    } else {
      shieldMat.opacity = 0;
    }

    // Engine particle trail emission
    trailTimer += delta;
    if (trailTimer > 0.035) {
      trailTimer = 0;
      const leftEngineWorld = new THREE.Vector3(-0.7, 0.05, -2.4).applyMatrix4(shipGroup.matrixWorld);
      const rightEngineWorld = new THREE.Vector3(0.7, 0.05, -2.4).applyMatrix4(shipGroup.matrixWorld);

      // Emit left
      trailPositions[trailHead * 3] = leftEngineWorld.x;
      trailPositions[trailHead * 3 + 1] = leftEngineWorld.y;
      trailPositions[trailHead * 3 + 2] = leftEngineWorld.z;
      trailHead = (trailHead + 1) % TRAIL_COUNT;

      // Emit right
      trailPositions[trailHead * 3] = rightEngineWorld.x;
      trailPositions[trailHead * 3 + 1] = rightEngineWorld.y;
      trailPositions[trailHead * 3 + 2] = rightEngineWorld.z;
      trailHead = (trailHead + 1) % TRAIL_COUNT;

      trailGeo.attributes.position.needsUpdate = true;
    }

    return {
      position: shipGroup.position,
      forward: forwardDir,
    };
  }

  function triggerRepulsorEffect() {
    shieldPulse = 1.0;
  }

  function resetPosition(pos: THREE.Vector3, target: THREE.Vector3) {
    shipGroup.position.copy(pos);
    shipGroup.lookAt(target);
    currentYaw = shipGroup.rotation.y;
    currentPitch = 0;
    currentRoll = 0;
  }

  return {
    group: shipGroup,
    trailGroup: trailPoints,
    update,
    triggerRepulsorEffect,
    resetPosition,
  };
}
