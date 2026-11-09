/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface GemData {
  id: number;
  name: string;
  zone: string;
  position: THREE.Vector3;
  collected: boolean;
  color: number;
  description: string;
  mesh?: THREE.Group;
}

export type CitizenAction = 'waving' | 'coffee' | 'reading' | 'telescope' | 'gardening';

export interface ResidentWindow {
  id: number;
  zoneName: string;
  residentName: string;
  activity: CitizenAction;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  description: string;
  group?: THREE.Group;
  waveArm?: THREE.Mesh;
  hasGreeted?: boolean;
}

export interface JoystickInput {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (forward/down) to 1 (backward/up)
  active: boolean;
}

export interface RadarGemBlip {
  id: number;
  name: string;
  x: number; // -1 to 1 (left to right on radar)
  y: number; // -1 to 1 (up to down on radar, -1 is forward)
  distance: number;
  elevation: number; // height diff (positive = above ship)
  isClamped: boolean;
  color: string;
}

export type CameraViewMode = 'chase' | 'cockpit' | 'panoramic';
