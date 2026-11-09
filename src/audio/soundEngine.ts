/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  // Ambient sound nodes
  private ambientGain: GainNode | null = null;
  private thrusterGain: GainNode | null = null;
  private thrusterOsc: OscillatorNode | null = null;
  private thrusterFilter: BiquadFilterNode | null = null;

  constructor() {
    // AudioContext will be initialized on first touch/click
  }

  public init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.setupAmbient();
      this.setupThruster();
      this.initialized = true;
    } catch {
      // Audio not supported or blocked
    }
  }

  private setupAmbient() {
    if (!this.ctx) return;

    const masterAmbient = this.ctx.createGain();
    masterAmbient.gain.value = this.isMuted ? 0 : 0.18;
    masterAmbient.connect(this.ctx.destination);
    this.ambientGain = masterAmbient;

    // Rich celestial drone chords (Frequencies in Hz: D2, A2, F#3, C#4, E4 - Lydian harmony)
    const freqs = [73.42, 110.0, 185.0, 277.18, 329.63];

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Subtle detune for shimmer
      osc.detune.setValueAtTime((idx - 2) * 4.5, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450 + idx * 80, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // LFO for slow breathing swells
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04 / (idx + 1), this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterAmbient);
      osc.start();
    });
  }

  private setupThruster() {
    if (!this.ctx) return;

    this.thrusterGain = this.ctx.createGain();
    this.thrusterGain.gain.value = this.isMuted ? 0 : 0.06;

    this.thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterFilter.type = 'lowpass';
    this.thrusterFilter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.thrusterOsc = this.ctx.createOscillator();
    this.thrusterOsc.type = 'triangle';
    this.thrusterOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.thrusterOsc.connect(this.thrusterFilter);
    this.thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.ctx.destination);
    this.thrusterOsc.start();
  }

  public updateFlightPitch(intensity: number) {
    if (!this.ctx || !this.thrusterOsc || !this.thrusterFilter) return;
    const baseFreq = 55 + Math.abs(intensity) * 18;
    this.thrusterOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
    this.thrusterFilter.frequency.setTargetAtTime(140 + Math.abs(intensity) * 60, this.ctx.currentTime, 0.1);
  }

  public playGemCollectSound() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    // Pentatonic high arpeggio chime (C6, E6, G6, B6, D7)
    const notes = [1046.5, 1318.51, 1567.98, 1975.53, 2349.32];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const startTime = now + idx * 0.065;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, startTime);
      filter.Q.setValueAtTime(3.0, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.95);
    });

    // Sub resonant tone
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(261.63, now); // C4
    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.25);
  }

  public playResidentGreetingSound() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    // Pleasant two-tone bell chime (G5 -> C6)
    const notes = [783.99, 1046.5];

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  }

  public playRepulsorCushionSound() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.18, this.ctx?.currentTime || 0, 0.1);
    }
    if (this.thrusterGain) {
      this.thrusterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.06, this.ctx?.currentTime || 0, 0.1);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
