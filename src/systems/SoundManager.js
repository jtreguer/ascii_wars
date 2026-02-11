import { CONFIG } from '../config.js';

const AUDIO = () => CONFIG.AUDIO;

// Small offset to ensure Web Audio events are scheduled in the future
const T_OFFSET = 0.015;

// A minor pentatonic frequencies across octaves
const BLEEP_FREQS = [523, 587, 659, 784, 880, 1047, 1175, 1319];
const BLOOP_FREQS = [110, 131, 147, 165, 196, 220, 262, 294];

export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.masterGain = null;
    this.droneNodes = [];
    this.bleepTimer = null;
    this.running = false;
  }

  init() {
    const snd = this.scene.sound;
    if (!snd || !snd.context) return false;
    this.ctx = snd.context;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = AUDIO().MASTER_VOLUME;
    this.masterGain.connect(this.ctx.destination);
    return true;
  }

  startAmbient() {
    if (!this.ctx || this.running) return;
    this.running = true;
    this._startDrone();
    this._scheduleBleep();
  }

  stopAmbient() {
    this.running = false;

    if (this.bleepTimer) {
      this.bleepTimer.destroy();
      this.bleepTimer = null;
    }

    const now = this.ctx?.currentTime ?? 0;
    for (const node of this.droneNodes) {
      try {
        if (node.stop) node.stop(now + 0.05);
        if (node.disconnect) node.disconnect();
      } catch (_) { /* already stopped */ }
    }
    this.droneNodes = [];
  }

  destroy() {
    this.stopAmbient();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    this.ctx = null;
  }

  // --- SFX ---

  _now() {
    return this.ctx.currentTime + T_OFFSET;
  }

  playPew() {
    if (!this.ctx) return;
    const cfg = AUDIO().SFX;
    const now = this._now();
    const dur = cfg.PEW_DURATION;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(cfg.PEW_FREQUENCY, now);
    osc.frequency.exponentialRampToValueAtTime(cfg.PEW_FREQUENCY_END, now + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(cfg.PEW_VOLUME, now + 0.005);
    gain.gain.setValueAtTime(cfg.PEW_VOLUME, now + dur * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  playDeath() {
    if (!this.ctx) return;
    const cfg = AUDIO().SFX;
    const now = this._now();

    cfg.DEATH_NOTES.forEach((freq, i) => {
      const start = now + i * (cfg.DEATH_NOTE_DURATION + cfg.DEATH_NOTE_GAP);
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(cfg.DEATH_VOLUME, start + 0.01);
      gain.gain.setValueAtTime(cfg.DEATH_VOLUME, start + cfg.DEATH_NOTE_DURATION * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, start + cfg.DEATH_NOTE_DURATION);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + cfg.DEATH_NOTE_DURATION + 0.01);
    });
  }

  playTriumph() {
    if (!this.ctx) return;
    const cfg = AUDIO().SFX;
    const now = this._now();
    const notes = cfg.TRIUMPH_NOTES;

    notes.forEach((freq, i) => {
      const start = now + i * (cfg.TRIUMPH_NOTE_DURATION + cfg.TRIUMPH_NOTE_GAP);
      const isLast = i === notes.length - 1;
      const dur = isLast ? cfg.TRIUMPH_FINAL_SUSTAIN : cfg.TRIUMPH_NOTE_DURATION;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      let osc2 = null;
      if (isLast) {
        osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 1.002;
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(cfg.TRIUMPH_VOLUME, start + 0.01);
      gain.gain.setValueAtTime(cfg.TRIUMPH_VOLUME, start + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      if (osc2) osc2.connect(gain);
      gain.connect(this.masterGain);

      osc.start(start);
      osc.stop(start + dur + 0.01);
      if (osc2) {
        osc2.start(start);
        osc2.stop(start + dur + 0.01);
      }
    });
  }

  playTokenCollect() {
    if (!this.ctx) return;
    const cfg = AUDIO().SFX;
    const now = this._now();
    const dur = cfg.TOKEN_DURATION;

    // Two slightly detuned sines for crystalline shimmer
    for (const detune of [0, cfg.TOKEN_DETUNE]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = cfg.TOKEN_FREQUENCY + detune;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(cfg.TOKEN_VOLUME, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    }
  }

  playEnemyKill() {
    if (!this.ctx) return;
    const cfg = AUDIO().SFX;
    const now = this._now();
    const dur = cfg.KILL_DURATION;

    // Quick ascending zap — two notes
    for (let i = 0; i < 2; i++) {
      const start = now + i * dur * 0.4;
      const freq = cfg.KILL_FREQUENCY * (i + 1);

      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 2, start + dur * 0.5);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(cfg.KILL_VOLUME, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + dur * 0.5 + 0.01);
    }
  }

  // --- private ---

  _startDrone() {
    const cfg = AUDIO().AMBIENT;
    const now = this.ctx.currentTime;

    // Sub-bass sine for warmth
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = cfg.DRONE_FREQUENCY;
    const subGain = this.ctx.createGain();
    subGain.gain.value = cfg.DRONE_VOLUME * 0.6;
    sub.connect(subGain);
    subGain.connect(this.masterGain);

    // Sawtooth drone through low-pass filter
    const saw = this.ctx.createOscillator();
    saw.type = 'sawtooth';
    saw.frequency.value = cfg.DRONE_FREQUENCY;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.DRONE_FILTER_FREQ;
    filter.Q.value = cfg.DRONE_FILTER_Q;

    // LFO modulates the filter cutoff for slow pulsing
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = cfg.DRONE_LFO_RATE;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = cfg.DRONE_LFO_DEPTH;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const droneGain = this.ctx.createGain();
    droneGain.gain.value = cfg.DRONE_VOLUME;
    saw.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    sub.start(now);
    saw.start(now);
    lfo.start(now);

    this.droneNodes.push(sub, subGain, saw, filter, lfo, lfoGain, droneGain);
  }

  _scheduleBleep() {
    if (!this.running) return;

    const cfg = AUDIO().AMBIENT;
    const delay = cfg.BLEEP_INTERVAL_MIN +
      Math.random() * (cfg.BLEEP_INTERVAL_MAX - cfg.BLEEP_INTERVAL_MIN);

    this.bleepTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.running) return;
      if (Math.random() > 0.45) {
        this._playBleep();
      } else {
        this._playBloop();
      }
      this._scheduleBleep();
    });
  }

  _playBleep() {
    const cfg = AUDIO().AMBIENT;
    const now = this._now();
    const freq = BLEEP_FREQS[Math.floor(Math.random() * BLEEP_FREQS.length)];
    const duration = 0.04 + Math.random() * 0.1;

    const osc = this.ctx.createOscillator();
    osc.type = Math.random() > 0.5 ? 'square' : 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(cfg.BLEEP_VOLUME, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  _playBloop() {
    const cfg = AUDIO().AMBIENT;
    const now = this._now();
    const freq = BLOOP_FREQS[Math.floor(Math.random() * BLOOP_FREQS.length)];
    const duration = 0.12 + Math.random() * 0.2;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(cfg.BLOOP_VOLUME, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }
}
