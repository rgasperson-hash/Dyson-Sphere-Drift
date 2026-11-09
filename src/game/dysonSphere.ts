/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GemData, ResidentWindow } from '../types';

export interface DysonWorld {
  worldGroup: THREE.Group;
  gems: GemData[];
  residentWindows: ResidentWindow[];
  update: (delta: number, playerPos: THREE.Vector3, time: number) => {
    collectedGem: GemData | null;
    greetedResident: ResidentWindow | null;
    repulsionVector: THREE.Vector3 | null;
  };
}

export function createDysonWorld(): DysonWorld {
  const worldGroup = new THREE.Group();
  const gems: GemData[] = [];
  const residentWindows: ResidentWindow[] = [];

  // -------------------------------------------------------------
  // MATERIALS (PBR standard materials)
  // -------------------------------------------------------------
  const starCoronaMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    wireframe: false,
  });

  const starCoreMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
  });

  const dysonStrutMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.35,
  });

  const dysonSolarPanelMat = new THREE.MeshStandardMaterial({
    color: 0x0369a1,
    metalness: 0.9,
    roughness: 0.15,
    emissive: 0x0284c7,
    emissiveIntensity: 0.12,
  });

  const habitatGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.6,
    roughness: 0.3,
  });

  const habitatWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    metalness: 0.4,
    roughness: 0.3,
  });

  const windowGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.45,
    transmission: 0.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false,
  });

  const windowCyanGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x67e8f9,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.5,
    transmission: 0.6,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false,
  });

  // -------------------------------------------------------------
  // 1. THE CENTRAL STELLAR CORE (Artificial Star)
  // -------------------------------------------------------------
  const starRadius = 55;
  const starCoreGeo = new THREE.SphereGeometry(starRadius, 32, 24);
  const starCore = new THREE.Mesh(starCoreGeo, starCoreMat);
  worldGroup.add(starCore);

  // Outer Coronal Glow Sphere
  const coronaGeo = new THREE.SphereGeometry(starRadius * 1.15, 24, 16);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xffd880,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  worldGroup.add(corona);

  // Star Point Light (Warm key light illuminating the entire inner sphere)
  const starLight = new THREE.PointLight(0xfff5eb, 3.2, 900, 0.4);
  starLight.position.set(0, 0, 0);
  worldGroup.add(starLight);

  // Ambient Star Plasma particles
  const starParticleCount = 120;
  const starParticleGeo = new THREE.BufferGeometry();
  const starParticlePos = new Float32Array(starParticleCount * 3);
  for (let i = 0; i < starParticleCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = starRadius * (1.2 + Math.random() * 0.35);
    starParticlePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starParticlePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starParticlePos[i * 3 + 2] = r * Math.cos(phi);
  }
  starParticleGeo.setAttribute('position', new THREE.BufferAttribute(starParticlePos, 3));
  const starParticleMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 2.5,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const starParticles = new THREE.Points(starParticleGeo, starParticleMat);
  worldGroup.add(starParticles);

  // -------------------------------------------------------------
  // 2. DYSON SPHERE SHELL & LATTICE FRAMEWORK (Radius ~320)
  // -------------------------------------------------------------
  const sphereRadius = 320;

  // Major Structural Rings encircling the sphere
  const ringGeometries = [
    { r: sphereRadius, tube: 3.2, rotX: 0, rotY: 0 },
    { r: sphereRadius, tube: 2.8, rotX: Math.PI / 3, rotY: Math.PI / 6 },
    { r: sphereRadius, tube: 2.8, rotX: -Math.PI / 3, rotY: -Math.PI / 6 },
    { r: sphereRadius, tube: 2.4, rotX: Math.PI / 2, rotY: 0 },
  ];

  ringGeometries.forEach((spec) => {
    const ringGeo = new THREE.TorusGeometry(spec.r, spec.tube, 12, 64);
    ringGeo.rotateX(spec.rotX);
    ringGeo.rotateY(spec.rotY);
    const ring = new THREE.Mesh(ringGeo, dysonStrutMat);
    worldGroup.add(ring);
  });

  // Equatorial Transit Ring with Solar Honeycomb Segments
  const panelCount = 36;
  for (let i = 0; i < panelCount; i++) {
    const angle = (i / panelCount) * Math.PI * 2;
    // Leave 4 large gaps for transit portals so player can fly in and out!
    const isPortal = i % 9 === 0 || i % 9 === 1;

    if (!isPortal) {
      const panelGroup = new THREE.Group();
      const panelGeo = new THREE.BoxGeometry(26, 60, 2.5);
      const panel = new THREE.Mesh(panelGeo, dysonSolarPanelMat);
      panelGroup.add(panel);

      // Gold frame around panel
      const frameGeo = new THREE.BoxGeometry(27, 61, 1.2);
      const frame = new THREE.Mesh(frameGeo, dysonStrutMat);
      panelGroup.add(frame);

      panelGroup.position.set(
        Math.cos(angle) * sphereRadius,
        0,
        Math.sin(angle) * sphereRadius
      );
      panelGroup.lookAt(0, 0, 0);
      worldGroup.add(panelGroup);
    } else {
      // Create Archway Portal Gate with luminous guide lights
      const archGeo = new THREE.TorusGeometry(38, 2.5, 12, 32, Math.PI);
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.6,
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(
        Math.cos(angle) * sphereRadius,
        0,
        Math.sin(angle) * sphereRadius
      );
      arch.lookAt(0, 0, 0);
      arch.rotateZ(Math.PI / 2);
      worldGroup.add(arch);
    }
  }

  // -------------------------------------------------------------
  // 3. ELEVATED HABITATION RINGS & SKY CITADELS
  // -------------------------------------------------------------

  // ARBORIA HABITAT RING (Radius 190, tilted)
  const arboriaGroup = new THREE.Group();
  arboriaGroup.rotation.x = 0.35;
  arboriaGroup.rotation.z = -0.2;
  worldGroup.add(arboriaGroup);

  const arboriaRingGeo = new THREE.TorusGeometry(190, 8, 16, 72);
  const arboriaRing = new THREE.Mesh(arboriaRingGeo, habitatWhiteMat);
  arboriaGroup.add(arboriaRing);

  // Arboria inner translucent solarium strip
  const solariumGeo = new THREE.TorusGeometry(188, 4, 12, 72);
  const solarium = new THREE.Mesh(solariumGeo, windowCyanGlassMat);
  arboriaGroup.add(solarium);

  // Hanging Habitation Pods along Arboria Ring
  const podCount = 12;
  for (let i = 0; i < podCount; i++) {
    const angle = (i / podCount) * Math.PI * 2;
    const podGroup = new THREE.Group();

    // Pod building
    const podGeo = new THREE.CylinderGeometry(5, 7, 14, 8);
    const pod = new THREE.Mesh(podGeo, habitatGoldMat);
    podGroup.add(pod);

    // Pod observation dome
    const domeGeo = new THREE.SphereGeometry(4.8, 12, 10);
    const dome = new THREE.Mesh(domeGeo, windowGlassMat);
    dome.position.y = 7;
    podGroup.add(dome);

    // Suspension spire
    const strutGeo = new THREE.CylinderGeometry(0.6, 0.6, 18);
    const strut = new THREE.Mesh(strutGeo, dysonStrutMat);
    strut.position.y = -8;
    podGroup.add(strut);

    podGroup.position.set(
      Math.cos(angle) * 190,
      -12,
      Math.sin(angle) * 190
    );
    arboriaGroup.add(podGroup);
  }

  // CELESTIA MEGAPLEX & RESEARCH TOWERS (Cluster around (120, 80, -100))
  const citadelGroup = new THREE.Group();
  citadelGroup.position.set(130, 80, -110);
  worldGroup.add(citadelGroup);

  // Spire Towers
  const towers = [
    { x: 0, y: 0, z: 0, h: 70, r: 9 },
    { x: 22, y: -10, z: 18, h: 52, r: 7 },
    { x: -20, y: -15, z: 12, h: 48, r: 6.5 },
    { x: 5, y: -25, z: -25, h: 60, r: 8 },
  ];

  towers.forEach((t) => {
    const towerGeo = new THREE.CylinderGeometry(t.r * 0.7, t.r, t.h, 10);
    const tower = new THREE.Mesh(towerGeo, habitatWhiteMat);
    tower.position.set(t.x, t.y + t.h / 2, t.z);
    citadelGroup.add(tower);

    // Crystalline spire crown
    const crownGeo = new THREE.ConeGeometry(t.r * 0.8, 16, 8);
    const crown = new THREE.Mesh(crownGeo, dysonSolarPanelMat);
    crown.position.set(t.x, t.y + t.h + 8, t.z);
    citadelGroup.add(crown);

    // Intermediate observation decks with glowing window bands
    for (let k = 1; k <= 3; k++) {
      const bandGeo = new THREE.CylinderGeometry(t.r * 0.85, t.r * 0.85, 3.5, 12);
      const band = new THREE.Mesh(bandGeo, windowGlassMat);
      band.position.set(t.x, t.y + (t.h / 4) * k, t.z);
      citadelGroup.add(band);
    }
  });

  // Skybridges connecting the towers
  const bridgeGeo = new THREE.BoxGeometry(26, 2.5, 3.5);
  const bridge1 = new THREE.Mesh(bridgeGeo, dysonStrutMat);
  bridge1.position.set(11, 28, 9);
  bridge1.rotation.y = Math.PI / 4;
  citadelGroup.add(bridge1);

  const bridge2 = new THREE.Mesh(bridgeGeo, dysonStrutMat);
  bridge2.position.set(-10, 22, 6);
  bridge2.rotation.y = -Math.PI / 5;
  citadelGroup.add(bridge2);

  // -------------------------------------------------------------
  // 4. INHABITED WINDOWS & WAVING/CHILLING RESIDENTS
  // -------------------------------------------------------------
  // Let's create distinctive observation windows where miniature 3D citizens
  // can be seen waving, drinking coffee, looking through telescopes, or relaxing!

  interface WindowConfig {
    id: number;
    zoneName: string;
    residentName: string;
    activity: 'waving' | 'coffee' | 'reading' | 'telescope' | 'gardening';
    pos: [number, number, number];
    rotY: number;
    description: string;
  }

  const windowConfigs: WindowConfig[] = [
    {
      id: 1,
      zoneName: 'Arboria Sky-Deck 1',
      residentName: 'Elena & Taro',
      activity: 'waving',
      pos: [0, 48, 192],
      rotY: 0,
      description: 'Waving enthusiastically with warm smiles from the high garden lounge!',
    },
    {
      id: 2,
      zoneName: 'Celestia Grand Observatory',
      residentName: 'Dr. Alistair',
      activity: 'telescope',
      pos: [130, 115, -95],
      rotY: -Math.PI / 4,
      description: 'Examining the stellar corona with a brass spectrometer, waving as you pass!',
    },
    {
      id: 3,
      zoneName: 'Zenith Solar Promenade',
      residentName: 'Sora',
      activity: 'coffee',
      pos: [-145, 60, 120],
      rotY: Math.PI / 3,
      description: 'Relaxing with a cup of celestial mocha, raising a toast to your flight!',
    },
    {
      id: 4,
      zoneName: 'Solarium Bio-Hollow',
      residentName: 'Kaelen',
      activity: 'gardening',
      pos: [-80, -90, 170],
      rotY: Math.PI / 6,
      description: 'Tending luminescent star-lilies and waving cheerfully!',
    },
    {
      id: 5,
      zoneName: 'Equatorial Gateway Station',
      residentName: 'Chief Mira',
      activity: 'waving',
      pos: [225, 12, 225],
      rotY: -Math.PI / 3,
      description: 'Guiding orbital traffic with a glowing luminous beacon wand!',
    },
    {
      id: 6,
      zoneName: 'Pulsar Lounge Ark',
      residentName: 'Zoe & Nia',
      activity: 'waving',
      pos: [-210, -40, -170],
      rotY: Math.PI * 0.7,
      description: 'Listening to ambient synth waves, waving both hands through the panoramic window!',
    },
    {
      id: 7,
      zoneName: 'Hyper-Ring Waystation',
      residentName: 'Mateo',
      activity: 'reading',
      pos: [60, -140, -160],
      rotY: -Math.PI * 0.6,
      description: 'Pausing his star chart datapad to wave hello at your ship!',
    },
    {
      id: 8,
      zoneName: 'Outer Apex Spire',
      residentName: 'Astrid',
      activity: 'waving',
      pos: [0, 240, 50],
      rotY: 0.1,
      description: 'Standing at the highest observation balcony, waving with joy!',
    },
  ];

  windowConfigs.forEach((cfg) => {
    const winGroup = new THREE.Group();
    winGroup.position.set(...cfg.pos);
    winGroup.rotation.y = cfg.rotY;

    // Window bay frame
    const frameGeo = new THREE.BoxGeometry(11, 7.5, 4);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    winGroup.add(frameMesh);

    // Interior Warm Room Glow
    const interiorGeo = new THREE.BoxGeometry(10.2, 6.8, 3.4);
    const interiorMat = new THREE.MeshBasicMaterial({
      color: cfg.id % 2 === 0 ? 0xfff7ed : 0xe0f2fe,
    });
    const interiorMesh = new THREE.Mesh(interiorGeo, interiorMat);
    interiorMesh.position.z = -0.2;
    winGroup.add(interiorMesh);

    // Front Window Glass pane
    const glassGeo = new THREE.PlaneGeometry(10.2, 6.8);
    const glassMesh = new THREE.Mesh(glassGeo, windowGlassMat);
    glassMesh.position.z = 1.8;
    winGroup.add(glassMesh);

    // Window sill light (warm cozy point light)
    const winLight = new THREE.PointLight(0xffedd5, 0.8, 18);
    winLight.position.set(0, 0, 1.2);
    winGroup.add(winLight);

    // Citizen Silhouette Figure (Body, Head, Waving Arm!)
    const personGroup = new THREE.Group();
    personGroup.position.set(cfg.id % 2 === 0 ? -1.2 : 0.8, -1.2, 0.6);

    // Torso / clothes
    const torsoGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.6, 8);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: cfg.id % 3 === 0 ? 0x0284c7 : cfg.id % 3 === 1 ? 0xd97706 : 0x059669,
      roughness: 0.6,
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.8;
    personGroup.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.38, 10, 10);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.5,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    personGroup.add(head);

    // Waving Arm (with pivot at shoulder)
    const armGroup = new THREE.Group();
    armGroup.position.set(0.6, 1.4, 0);

    const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 6);
    armGeo.translate(0, 0.45, 0); // pivot at shoulder
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.5,
    });
    const arm = new THREE.Mesh(armGeo, armMat);
    armGroup.add(arm);

    // Hand holding small luminous mug or waving hand
    const handGeo = new THREE.SphereGeometry(0.16, 6, 6);
    const handMat = new THREE.MeshBasicMaterial({
      color: cfg.activity === 'coffee' ? 0xffedd5 : 0x38bdf8,
    });
    const hand = new THREE.Mesh(handGeo, handMat);
    hand.position.set(0, 0.9, 0);
    armGroup.add(hand);

    personGroup.add(armGroup);

    // If second person in window (e.g. Elena & Taro or Zoe & Nia)
    if (cfg.residentName.includes('&')) {
      const companionGroup = new THREE.Group();
      companionGroup.position.set(cfg.id % 2 === 0 ? 1.5 : -1.5, -1.2, 0.5);

      const cTorso = new THREE.Mesh(torsoGeo, new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.6 }));
      cTorso.position.y = 0.8;
      companionGroup.add(cTorso);

      const cHead = new THREE.Mesh(headGeo, headMat);
      cHead.position.y = 1.95;
      companionGroup.add(cHead);

      winGroup.add(companionGroup);
    }

    winGroup.add(personGroup);
    worldGroup.add(winGroup);

    residentWindows.push({
      id: cfg.id,
      zoneName: cfg.zoneName,
      residentName: cfg.residentName,
      activity: cfg.activity,
      position: new THREE.Vector3(...cfg.pos),
      direction: new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cfg.rotY),
      description: cfg.description,
      group: winGroup,
      waveArm: arm,
      hasGreeted: false,
    });
  });

  // -------------------------------------------------------------
  // 5. STELLAR GEMS (Prisms to discover across the Dyson world)
  // -------------------------------------------------------------
  interface GemConfig {
    id: number;
    name: string;
    zone: string;
    pos: [number, number, number];
    color: number;
    description: string;
  }

  const gemConfigs: GemConfig[] = [
    {
      id: 1,
      name: 'Starlight Prism',
      zone: 'Arboria Solarium Arch',
      pos: [0, 42, 190],
      color: 0x38bdf8,
      description: 'Hidden beneath the soaring crystal arches of the Arboria Ring.',
    },
    {
      id: 2,
      name: 'Corona Topaz',
      zone: 'Inner Flare Basin',
      pos: [65, 30, 40],
      color: 0xfbbf24,
      description: 'Drifting serenely near the warm filaments of the stellar core.',
    },
    {
      id: 3,
      name: 'Celestia Diamond',
      zone: 'Spire Sanctuary',
      pos: [130, 150, -110],
      color: 0xe0e7ff,
      description: 'Hovering atop the highest spire peak of the Celestia complex.',
    },
    {
      id: 4,
      name: 'Azure Dynamo',
      zone: 'Equatorial Transit Arch Alpha',
      pos: [315, 0, 40],
      color: 0x06b6d4,
      description: 'Resting within the gateway aperture leading to outer space.',
    },
    {
      id: 5,
      name: 'Emerald Solarium',
      zone: 'Bioluminescent Hollow',
      pos: [-100, -80, 160],
      color: 0x10b981,
      description: 'Bathed in emerald starlight inside the hanging biosphere pods.',
    },
    {
      id: 6,
      name: 'Pulsar Amethyst',
      zone: 'Zenith Canopy',
      pos: [-140, 120, -70],
      color: 0xa855f7,
      description: 'Vibrating with subtle cosmic frequencies in the northern pavilion.',
    },
    {
      id: 7,
      name: 'Solaris Firestone',
      zone: 'Energy Collector Nexus',
      pos: [-45, -50, -85],
      color: 0xf97316,
      description: 'Glowing with captured stellar warmth between twin solar arrays.',
    },
    {
      id: 8,
      name: 'Nova Sapphire',
      zone: 'Outer Void Horizon',
      pos: [180, 180, 260],
      color: 0x3b82f6,
      description: 'Floating beyond the Dyson shell among deep space star-sails.',
    },
    {
      id: 9,
      name: 'Prismatic Citrine',
      zone: 'Skybridge Overlook',
      pos: [142, 70, -98],
      color: 0xfacc15,
      description: 'Hovering right above the illuminated skybridge promenade.',
    },
    {
      id: 10,
      name: 'Opaline Aegis',
      zone: 'Southern Polar Conduit',
      pos: [0, -220, 0],
      color: 0xf472b6,
      description: 'Suspended in the calm focal point of the southern polar portal.',
    },
    {
      id: 11,
      name: 'Echo Crystal',
      zone: 'Quiet Haven Pod',
      pos: [-220, -20, 140],
      color: 0x2dd4bf,
      description: 'A soothing resonant prism hidden beside a residential observatory.',
    },
    {
      id: 12,
      name: 'Helios Heart',
      zone: 'Corona Zenith',
      pos: [0, 85, 0],
      color: 0xffedd5,
      description: 'The golden crown gem situated right above the central sun.',
    },
  ];

  // Gem faceted geometries
  const gemGeo = new THREE.OctahedronGeometry(2.2, 0);
  const ringGeo = new THREE.TorusGeometry(3.6, 0.15, 8, 24);

  gemConfigs.forEach((cfg) => {
    const gemGroup = new THREE.Group();
    gemGroup.position.set(...cfg.pos);

    // Glowing faceted crystal
    const crystalMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.3,
    });
    const crystal = new THREE.Mesh(gemGeo, crystalMat);
    gemGroup.add(crystal);

    // Orbiting light halo ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(ringGeo, ringMat);
    halo.rotation.x = Math.PI / 3;
    gemGroup.add(halo);

    // Subtle point light for local radiance
    const pLight = new THREE.PointLight(cfg.color, 1.2, 28);
    gemGroup.add(pLight);

    worldGroup.add(gemGroup);

    gems.push({
      id: cfg.id,
      name: cfg.name,
      zone: cfg.zone,
      position: new THREE.Vector3(...cfg.pos),
      collected: false,
      color: cfg.color,
      description: cfg.description,
      mesh: gemGroup,
    });
  });

  // -------------------------------------------------------------
  // 6. OUTER SPACE STAR-SAILS & FLOATING RELAYS
  // -------------------------------------------------------------
  const sailCount = 20;
  for (let i = 0; i < sailCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = sphereRadius * (1.15 + Math.random() * 0.3);

    const sailGroup = new THREE.Group();
    sailGroup.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );

    // Hexagonal reflector sail
    const sailGeo = new THREE.CylinderGeometry(14, 14, 0.6, 6);
    const sail = new THREE.Mesh(sailGeo, dysonSolarPanelMat);
    sailGroup.add(sail);

    // Spire beacon
    const beaconSpireGeo = new THREE.CylinderGeometry(0.4, 0.8, 18, 6);
    const beaconSpire = new THREE.Mesh(beaconSpireGeo, dysonStrutMat);
    beaconSpire.position.y = 9;
    sailGroup.add(beaconSpire);

    sailGroup.lookAt(0, 0, 0);
    worldGroup.add(sailGroup);
  }

  // -------------------------------------------------------------
  // UPDATE LOOP & INTERACTIONS
  // -------------------------------------------------------------
  const GEM_COLLECT_DIST = 14.0;
  const RESIDENT_GREET_DIST = 55.0;

  function update(delta: number, playerPos: THREE.Vector3, time: number) {
    let collectedGem: GemData | null = null;
    let greetedResident: ResidentWindow | null = null;
    let repulsionVector: THREE.Vector3 | null = null;

    // 1. Animate Central Star
    starCore.rotation.y += delta * 0.08;
    corona.rotation.y -= delta * 0.05;
    starParticles.rotation.y += delta * 0.04;

    // 2. Animate Gems & Check Collision
    gems.forEach((gem) => {
      if (gem.collected || !gem.mesh) return;

      // Gentle floating spin
      gem.mesh.rotation.y += delta * 1.4;
      gem.mesh.rotation.x = Math.sin(time * 2 + gem.id) * 0.3;
      gem.mesh.position.y = gem.position.y + Math.sin(time * 2.5 + gem.id) * 1.2;

      // Distance check to player
      const dist = playerPos.distanceTo(gem.mesh.position);
      if (dist < GEM_COLLECT_DIST) {
        gem.collected = true;
        gem.mesh.visible = false;
        collectedGem = gem;
      }
    });

    // 3. Animate Residents Waving & Check Proximity
    residentWindows.forEach((rw) => {
      // Waving arm animation
      if (rw.waveArm) {
        if (rw.activity === 'waving') {
          // Energetic waving back and forth
          rw.waveArm.rotation.z = 0.5 + Math.sin(time * 5.5 + rw.id) * 0.65;
        } else if (rw.activity === 'coffee') {
          // Slow lifting of mug
          rw.waveArm.rotation.z = 0.3 + Math.sin(time * 1.8 + rw.id) * 0.25;
        } else {
          rw.waveArm.rotation.z = 0.4 + Math.sin(time * 3.0 + rw.id) * 0.35;
        }
      }

      // Check distance to player
      const dist = playerPos.distanceTo(rw.position);
      if (dist < RESIDENT_GREET_DIST && !rw.hasGreeted) {
        rw.hasGreeted = true;
        greetedResident = rw;
      } else if (dist > RESIDENT_GREET_DIST * 2.2) {
        // Reset greeting flag when flying far away so player can greet again later!
        rw.hasGreeted = false;
      }
    });

    // 4. Harmonic Repulsor Cushion (Safe exploratory flight - no crashes or damage!)
    // Check against central star (radius 55)
    const distToStar = playerPos.length();
    if (distToStar < starRadius + 10) {
      repulsionVector = playerPos.clone().normalize().multiplyScalar(1);
    }

    // Outer boundary cushion (around 520 radius) to keep player within world
    if (distToStar > 540) {
      repulsionVector = playerPos.clone().normalize().negate().multiplyScalar(1);
    }

    return {
      collectedGem,
      greetedResident,
      repulsionVector,
    };
  }

  return {
    worldGroup,
    gems,
    residentWindows,
    update,
  };
}
