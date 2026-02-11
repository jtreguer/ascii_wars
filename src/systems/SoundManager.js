import { CONFIG } from '../config.js';

const AUDIO = () => CONFIG.AUDIO;

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

  // --- SFX (file-based via Phaser sound) ---

  playPew() {
    this.scene.sound.play('pew', { volume: AUDIO().SFX.PEW_VOLUME });
  }

  playDeath() {
    this.scene.sound.play('death', { volume: AUDIO().SFX.DEATH_VOLUME });
  }

  playTriumph() {
    this.scene.sound.play('triumph', { volume: AUDIO().SFX.TRIUMPH_VOLUME });
  }

  playTokenCollect() {
    this.scene.sound.play('token', { volume: AUDIO().SFX.TOKEN_VOLUME });
  }

  playEnemyKill() {
    this.scene.sound.play('kill', { volume: AUDIO().SFX.KILL_VOLUME });
  }

  playHit() {
    this.scene.sound.play('hit', { volume: AUDIO().SFX.HIT_VOLUME });
  }

  playSpeedBonus() {
    this.scene.sound.play('speed', { volume: CONFIG.SPEED_BONUS.VOLUME });
  }

  playDiscCarrier() {
    this.scene.sound.play('disc_carrier', { volume: CONFIG.DISC_CARRIER.VOLUME });
  }

  playAlertSiren() {
    if (!this.ctx || !this.masterGain) return;
    const cfg = AUDIO().SFX;
    const now = this.ctx.currentTime;
    const dur = cfg.ALERT_DURATION;
    const sweeps = cfg.ALERT_SWEEPS;
    const lo = cfg.ALERT_FREQ_LOW;
    const hi = cfg.ALERT_FREQ_HIGH;
    const step = dur / (sweeps * 2);

    // Two detuned oscillators for a thick screeching tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    osc2.detune.value = 15;

    // Siren sweep: rapid up-down frequency ramps
    for (const osc of [osc1, osc2]) {
      osc.frequency.setValueAtTime(lo, now);
      for (let i = 0; i < sweeps; i++) {
        const t = now + i * step * 2;
        osc.frequency.linearRampToValueAtTime(hi, t + step);
        osc.frequency.linearRampToValueAtTime(lo, t + step * 2);
      }
    }

    // Gain envelope — sustain then fade out
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(cfg.ALERT_VOLUME, now);
    gain.gain.setValueAtTime(cfg.ALERT_VOLUME, now + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, now + dur);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
  }

  // --- Ambient (Web Audio drone + file-based bleeps/bloops) ---

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
    // Random pitch variation via rate
    const rate = 0.6 + Math.random() * 1.4;
    this.scene.sound.play('bleep', { volume: cfg.BLEEP_VOLUME, rate });
  }

  _playBloop() {
    const cfg = AUDIO().AMBIENT;
    const rate = 0.5 + Math.random() * 1.0;
    this.scene.sound.play('bloop', { volume: cfg.BLOOP_VOLUME, rate });
  }
}
