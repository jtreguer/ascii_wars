#!/usr/bin/env node
// Generates 8-bit WAV sound effects for ASCII Wars.
// Run: node generate-sounds.js

const fs = require('fs');
const path = require('path');

const RATE = 22050;
const DIR = path.join(__dirname, 'public', 'assets', 'audio');

fs.mkdirSync(DIR, { recursive: true });

// --- WAV writer ---

function writeWav(filename, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);       // PCM
  buf.writeUInt16LE(1, 22);       // mono
  buf.writeUInt32LE(RATE, 24);    // sample rate
  buf.writeUInt32LE(RATE, 28);    // byte rate
  buf.writeUInt16LE(1, 32);       // block align
  buf.writeUInt16LE(8, 34);       // 8-bit
  buf.write('data', 36);
  buf.writeUInt32LE(n, 40);
  for (let i = 0; i < n; i++) {
    buf.writeUInt8(Math.max(0, Math.min(255, Math.round((samples[i] + 1) * 127.5))), 44 + i);
  }
  fs.writeFileSync(path.join(DIR, filename), buf);
  console.log(`  ${filename} (${n} samples, ${(n / RATE).toFixed(3)}s)`);
}

// --- Oscillators ---

function osc(type, phase) {
  const p = ((phase % 1) + 1) % 1;
  switch (type) {
    case 'sine': return Math.sin(p * 2 * Math.PI);
    case 'square': return p < 0.5 ? 1 : -1;
    case 'sawtooth': return 2 * p - 1;
    case 'triangle': return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
  }
}

function expInterp(a, b, t) { return a * Math.pow(b / a, Math.max(0, Math.min(1, t))); }

// --- Sound generators ---

function genPew() {
  const dur = 0.18, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(1200, 300, t);
    phase += freq / RATE;
    samples[i] = osc('square', phase) * 0.6 * (1 - t);
  }
  return samples;
}

function genDeath() {
  const notes = [330, 262, 220];
  const noteDur = 0.18, gap = 0.08;
  const totalDur = notes.length * noteDur + (notes.length - 1) * gap;
  const n = Math.floor(RATE * totalDur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let noteIdx = -1, noteT = 0, elapsed = 0;
    for (let j = 0; j < notes.length; j++) {
      if (t >= elapsed && t < elapsed + noteDur) {
        noteIdx = j;
        noteT = (t - elapsed) / noteDur;
        break;
      }
      elapsed += noteDur + gap;
    }
    if (noteIdx >= 0) {
      phase += notes[noteIdx] / RATE;
      let env = 1;
      if (noteT < 0.05) env = noteT / 0.05;
      else if (noteT > 0.6) env = (1 - noteT) / 0.4;
      samples[i] = osc('square', phase) * 0.5 * env;
    } else {
      phase = 0;
    }
  }
  return samples;
}

function genTriumph() {
  const notes = [523, 659, 784, 1047];
  const noteDur = 0.15, gap = 0.05, lastSustain = 0.4;
  const totalDur = (notes.length - 1) * (noteDur + gap) + lastSustain;
  const n = Math.floor(RATE * totalDur);
  const samples = new Float32Array(n);
  let phase = 0, phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let noteIdx = -1, noteT = 0, elapsed = 0;
    for (let j = 0; j < notes.length; j++) {
      const d = j === notes.length - 1 ? lastSustain : noteDur;
      if (t >= elapsed && t < elapsed + d) {
        noteIdx = j;
        noteT = (t - elapsed) / d;
        break;
      }
      elapsed += d + gap;
    }
    if (noteIdx >= 0) {
      const freq = notes[noteIdx];
      phase += freq / RATE;
      let env = 1;
      if (noteT < 0.05) env = noteT / 0.05;
      else if (noteT > 0.5) env = (1 - noteT) / 0.5;
      let val = osc('sine', phase) * 0.45 * env;
      if (noteIdx === notes.length - 1) {
        phase2 += (freq * 1.003) / RATE;
        val = (val + osc('sine', phase2) * 0.45 * env) * 0.6;
      }
      samples[i] = val;
    } else {
      phase = 0;
      phase2 = 0;
    }
  }
  return samples;
}

function genToken() {
  const dur = 0.22, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    p1 += 1319 / RATE;
    p2 += 1327 / RATE;
    let env = t < 0.02 ? t / 0.02 : Math.pow(1 - t, 2);
    samples[i] = (osc('sine', p1) + osc('sine', p2)) * 0.4 * env;
  }
  return samples;
}

function genKill() {
  const dur = 0.18, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    let val = 0;
    for (let j = 0; j < 2; j++) {
      const start = j * 0.35;
      const lt = t - start;
      if (lt >= 0 && lt < 0.55) {
        const base = 440 * (j + 1);
        const freq = expInterp(base, base * 2, lt / 0.55);
        phase += freq / RATE;
        let env = lt < 0.02 ? lt / 0.02 : (0.55 - lt) / 0.53;
        val += osc('square', phase) * 0.35 * env;
      }
    }
    samples[i] = val;
  }
  return samples;
}

function genHit() {
  const dur = 0.35, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(180, 60, t);
    p1 += freq / RATE;
    p2 += (freq + 3) / RATE;
    let env = t < 0.03 ? t / 0.03 : Math.pow(1 - t, 1.5);
    samples[i] = (osc('sawtooth', p1) + osc('square', p2)) * 0.35 * env;
  }
  return samples;
}

function genBleep() {
  const dur = 0.08, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  const freq = 880;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    phase += freq / RATE;
    let env = t < 0.05 ? t / 0.05 : (1 - t) / 0.95;
    samples[i] = osc('square', phase) * 0.4 * env;
  }
  return samples;
}

function genBloop() {
  const dur = 0.2, n = Math.floor(RATE * dur);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const freq = expInterp(220, 110, t);
    phase += freq / RATE;
    let env = t < 0.05 ? t / 0.05 : Math.pow(1 - t, 1.2);
    samples[i] = osc('triangle', phase) * 0.4 * env;
  }
  return samples;
}

// --- Generate all ---

console.log('Generating 8-bit WAV sounds in public/assets/audio/...');
writeWav('pew.wav', genPew());
writeWav('death.wav', genDeath());
writeWav('triumph.wav', genTriumph());
writeWav('token.wav', genToken());
writeWav('kill.wav', genKill());
writeWav('hit.wav', genHit());
writeWav('bleep.wav', genBleep());
writeWav('bloop.wav', genBloop());
console.log('Done! 8 sound files generated.');
