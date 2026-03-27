import type { SoundTheme } from '@/types/settings.types';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  // Safari may suspend context until user gesture
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function master(ac: AudioContext, volume: number): GainNode {
  const g = ac.createGain();
  g.gain.value = Math.max(0, Math.min(1, volume));
  g.connect(ac.destination);
  return g;
}

// Frequency by adjacent mine count (0 = empty cell, no mines adjacent)
const MINE_COUNT_FREQ: Record<number, number> = {
  0: 220,
  1: 330,
  2: 440,
  3: 550,
  4: 660,
  5: 770,
  6: 880,
  7: 1000,
  8: 1200,
};

type OscType = OscillatorType;

function oscType(soundTheme: SoundTheme): OscType {
  if (soundTheme === 'arcade') {
    return 'square';
  }
  if (soundTheme === 'minimal') {
    return 'triangle';
  }
  return 'sine';
}

// ─── Classic / Arcade / Minimal ──────────────────────────────────────────────

function playWhoosh(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx();
  const volMult = soundTheme === 'minimal' ? 0.2 : 0.35;
  const out = master(ac, volume * volMult);
  const t = ac.currentTime;
  const dur = soundTheme === 'minimal' ? 0.12 : 0.2;

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = oscType(soundTheme);
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + dur);

  env.gain.setValueAtTime(0.5, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur);
}

function playReveal(
  mineCount: number,
  cascadeSize: number,
  volume: number,
  soundTheme: SoundTheme
): void {
  // Cascade whoosh: flood-fill revealed ≥ 6 cells at once
  if (cascadeSize >= 6) {
    playWhoosh(volume, soundTheme);
    return;
  }

  const ac = getCtx();
  const volMult = soundTheme === 'minimal' ? 0.25 : 0.4;
  const out = master(ac, volume * volMult);
  const t = ac.currentTime;
  const dur = soundTheme === 'minimal' ? 0.05 : soundTheme === 'arcade' ? 0.06 : 0.07;
  const freq = MINE_COUNT_FREQ[mineCount] ?? 880;

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = oscType(soundTheme);
  osc.frequency.setValueAtTime(freq * 2, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + dur);

  const attackEnd = t + (soundTheme === 'arcade' ? 0.003 : 0.01);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.8 : 0.6, attackEnd);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);

  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);

  // High mine count (7-8): add a dissonant second oscillator
  if (mineCount >= 7) {
    const osc2 = ac.createOscillator();
    const env2 = ac.createGain();
    osc2.type = oscType(soundTheme);
    // Minor second interval (~1.06× = ~100 cents sharp)
    osc2.frequency.setValueAtTime(freq * 2 * 1.059, t);
    osc2.frequency.exponentialRampToValueAtTime(freq * 1.059, t + dur);
    env2.gain.setValueAtTime(0, t);
    env2.gain.linearRampToValueAtTime(0.3, attackEnd);
    env2.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
    osc2.connect(env2);
    env2.connect(out);
    osc2.start(t);
    osc2.stop(t + dur + 0.03);
  }
}

function playFlag(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx();
  const volMult = soundTheme === 'minimal' ? 0.3 : 0.45;
  const out = master(ac, volume * volMult);
  const t = ac.currentTime;
  const noteCount = soundTheme === 'minimal' ? 1 : 2;
  const freqs = [660, 880];
  const gap = soundTheme === 'arcade' ? 0.03 : 0.04;
  const decay = soundTheme === 'minimal' ? 0.04 : 0.05;

  for (let i = 0; i < noteCount; i++) {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    const freq = freqs[i] ?? 660;
    osc.type = oscType(soundTheme);
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, t + i * gap);
    env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.5 : 0.3, t + i * gap + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, t + i * gap + decay);
    osc.connect(env);
    env.connect(out);
    osc.start(t + i * gap);
    osc.stop(t + i * gap + decay + 0.01);
  }
}

function playExplode(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx();
  const volMult = soundTheme === 'minimal' ? 0.4 : 0.7;
  const out = master(ac, volume * volMult);
  const t = ac.currentTime;
  const dur = soundTheme === 'minimal' ? 0.25 : 0.5;

  if (soundTheme !== 'minimal') {
    const bufLen = ac.sampleRate * dur;
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const noiseEnv = ac.createGain();
    noiseEnv.gain.setValueAtTime(1, t);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + dur);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = soundTheme === 'arcade' ? 2000 : 1200;
    noise.connect(filter);
    filter.connect(noiseEnv);
    noiseEnv.connect(out);
    noise.start(t);
    noise.stop(t + dur);
  }

  const osc = ac.createOscillator();
  const oscEnv = ac.createGain();
  osc.type = soundTheme === 'arcade' ? 'sawtooth' : 'sine';
  const startFreq = soundTheme === 'minimal' ? 80 : 120;
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(soundTheme === 'minimal' ? 25 : 30, t + dur * 0.6);
  oscEnv.gain.setValueAtTime(soundTheme === 'minimal' ? 0.6 : 1, t);
  oscEnv.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
  osc.connect(oscEnv);
  oscEnv.connect(out);
  osc.start(t);
  osc.stop(t + dur * 0.7);
}

function playWin(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx();
  const volMult = soundTheme === 'minimal' ? 0.3 : 0.5;
  const out = master(ac, volume * volMult);
  const t = ac.currentTime;

  // C4 E4 G4 C5 arpeggio
  const notes = [261.63, 329.63, 392.0, 523.25];
  const spacing = soundTheme === 'arcade' ? 0.09 : 0.12;
  const noteDur = soundTheme === 'minimal' ? 0.12 : 0.22;

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = oscType(soundTheme);
    osc.frequency.value = freq;
    const start = t + i * spacing;
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.8 : 0.6, start + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, start + noteDur);
    osc.connect(env);
    env.connect(out);
    osc.start(start);
    osc.stop(start + noteDur + 0.03);
  });
}

// ─── Star Wars ───────────────────────────────────────────────────────────────
// All sounds synthesized via Web Audio API — no audio files needed.
//
// Lightsaber pings map mine count → pitch (higher count = higher tension).
const SW_MINE_FREQ: Record<number, number> = {
  0: 196, // G3 – safe empty cell, low hum
  1: 246, // B3
  2: 294, // D4
  3: 349, // F4
  4: 392, // G4
  5: 466, // Bb4
  6: 554, // Db5
  7: 659, // E5
  8: 784, // G5 – maximum tension
};

/**
 * Lightsaber swing: a sawtooth sweep up then back down, like a blade whooshing
 * past. Used for cascade reveals (≥6 cells at once).
 */
function playStarWarsWhoosh(volume: number): void {
  const ac = getCtx();
  const out = master(ac, volume * 0.38);
  const t = ac.currentTime;
  const dur = 0.28;

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(750, t + dur * 0.35);
  osc.frequency.exponentialRampToValueAtTime(220, t + dur);

  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.7, t + 0.018);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/**
 * Lightsaber ping: a quick sawtooth burst + sub-octave hum that settles to a
 * pitch matching the adjacent mine count.
 */
function playStarWarsReveal(mineCount: number, cascadeSize: number, volume: number): void {
  if (cascadeSize >= 6) {
    playStarWarsWhoosh(volume);
    return;
  }

  const ac = getCtx();
  const out = master(ac, volume * 0.38);
  const t = ac.currentTime;
  const freq = SW_MINE_FREQ[mineCount] ?? 392;
  const dur = 0.09;

  // Main oscillator: sawtooth gives the electric "buzz" of an active blade
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq * 1.6, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + dur);
  env.gain.setValueAtTime(0.65, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.06);

  // Sub-octave hum for body/richness
  const sub = ac.createOscillator();
  const subEnv = ac.createGain();
  sub.type = 'sine';
  sub.frequency.value = freq * 0.5;
  subEnv.gain.setValueAtTime(0.28, t);
  subEnv.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.08);
  sub.connect(subEnv);
  subEnv.connect(out);
  sub.start(t);
  sub.stop(t + dur + 0.09);
}

/**
 * R2-D2 chirps: two quick ascending sine sweeps, the classic droid "beep boop"
 * used when placing a flag.
 */
function playStarWarsFlag(volume: number): void {
  const ac = getCtx();
  const out = master(ac, volume * 0.42);
  const t = ac.currentTime;

  const chirps = [
    { delay: 0.0, f0: 900, f1: 1400, dur: 0.065 },
    { delay: 0.1, f0: 1200, f1: 1800, dur: 0.055 },
  ];

  chirps.forEach(({ delay, f0, f1, dur }) => {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f0, t + delay);
    osc.frequency.exponentialRampToValueAtTime(f1, t + delay + dur);
    env.gain.setValueAtTime(0, t + delay);
    env.gain.linearRampToValueAtTime(0.55, t + delay + 0.006);
    env.gain.exponentialRampToValueAtTime(0.001, t + delay + dur + 0.025);
    osc.connect(env);
    env.connect(out);
    osc.start(t + delay);
    osc.stop(t + delay + dur + 0.03);
  });
}

/**
 * TIE fighter scream + explosion: a sharp sawtooth sweep from ~2 kHz down to
 * ~70 Hz (the iconic TIE engine wail) layered with a white-noise burst for the
 * mine detonation.
 */
function playStarWarsExplode(volume: number): void {
  const ac = getCtx();
  const out = master(ac, volume * 0.65);
  const t = ac.currentTime;
  const dur = 0.6;

  // TIE fighter scream: high → low sawtooth sweep
  const tie = ac.createOscillator();
  const tieEnv = ac.createGain();
  tie.type = 'sawtooth';
  tie.frequency.setValueAtTime(2200, t);
  tie.frequency.exponentialRampToValueAtTime(70, t + dur * 0.55);
  tieEnv.gain.setValueAtTime(0.85, t);
  tieEnv.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
  tie.connect(tieEnv);
  tieEnv.connect(out);
  tie.start(t);
  tie.stop(t + dur * 0.65);

  // Explosion noise burst
  const bufLen = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const noiseEnv = ac.createGain();
  noiseEnv.gain.setValueAtTime(0.7, t);
  noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + dur);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1400;
  noise.connect(filter);
  filter.connect(noiseEnv);
  noiseEnv.connect(out);
  noise.start(t);
  noise.stop(t + dur);
}

/**
 * Imperial March opening sting — G4 G4 G4 Eb4 Bb3 G4 — played on a sawtooth
 * oscillator to suggest the brass section of the London Symphony Orchestra.
 */
function playStarWarsWin(volume: number): void {
  const ac = getCtx();
  const out = master(ac, volume * 0.48);
  const t = ac.currentTime;

  // G4=392, Eb4=311.13, Bb3=233.08
  const notes = [
    { freq: 392.0, start: 0.0, dur: 0.18 }, // G4 (quarter)
    { freq: 392.0, start: 0.22, dur: 0.18 }, // G4 (quarter)
    { freq: 392.0, start: 0.44, dur: 0.18 }, // G4 (quarter)
    { freq: 311.13, start: 0.66, dur: 0.14 }, // Eb4 (dotted eighth)
    { freq: 233.08, start: 0.82, dur: 0.05 }, // Bb3 (sixteenth)
    { freq: 392.0, start: 0.9, dur: 0.38 }, // G4 (half — let it ring)
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = 'sawtooth'; // brass-like timbre
    osc.frequency.value = freq;
    const ns = t + start;
    env.gain.setValueAtTime(0, ns);
    env.gain.linearRampToValueAtTime(0.72, ns + 0.012);
    env.gain.setValueAtTime(0.72, ns + dur * 0.65);
    env.gain.exponentialRampToValueAtTime(0.001, ns + dur + 0.06);
    osc.connect(env);
    env.connect(out);
    osc.start(ns);
    osc.stop(ns + dur + 0.08);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export type SoundName = 'reveal' | 'flag' | 'explode' | 'win';

export interface SoundOptions {
  soundTheme?: SoundTheme;
  mineCount?: number;
  cascadeSize?: number;
}

export function playSound(name: SoundName, volume: number, options: SoundOptions = {}): void {
  const { soundTheme = 'classic', mineCount = 1, cascadeSize = 1 } = options;
  try {
    if (soundTheme === 'starwars') {
      switch (name) {
        case 'reveal':
          playStarWarsReveal(mineCount, cascadeSize, volume);
          break;
        case 'flag':
          playStarWarsFlag(volume);
          break;
        case 'explode':
          playStarWarsExplode(volume);
          break;
        case 'win':
          playStarWarsWin(volume);
          break;
      }
      return;
    }

    switch (name) {
      case 'reveal':
        playReveal(mineCount, cascadeSize, volume, soundTheme);
        break;
      case 'flag':
        playFlag(volume, soundTheme);
        break;
      case 'explode':
        playExplode(volume, soundTheme);
        break;
      case 'win':
        playWin(volume, soundTheme);
        break;
    }
  } catch {
    // AudioContext may not be available (e.g. in tests) — fail silently
  }
}
