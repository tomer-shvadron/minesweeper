import type { SoundTheme } from '@/types/settings.types';

// ─── Audio context management ───────────────────────────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  // Mobile Safari can close the context when the tab is backgrounded
  if (!ctx || ctx.state === 'closed') {
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

// ─── Shared synthesis helpers ───────────────────────────────────────────────

/** Create an oscillator with an attack-decay envelope, connected to `out`. */
function createTone(
  ac: AudioContext,
  out: GainNode,
  opts: {
    type: OscillatorType;
    freq: number;
    freqEnd?: number;
    start: number;
    dur: number;
    attack?: number;
    peakGain?: number;
  }
): void {
  const { type, freq, freqEnd, start, dur, attack = 0.01, peakGain = 0.6 } = opts;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  }
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(peakGain, start + attack);
  env.gain.exponentialRampToValueAtTime(0.001, start + dur + 0.02);
  osc.connect(env);
  env.connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

/** Create white noise burst with lowpass filter, connected to `out`. */
function createNoiseBurst(
  ac: AudioContext,
  out: GainNode,
  opts: { start: number; dur: number; filterFreq: number; peakGain?: number }
): void {
  const { start, dur, filterFreq, peakGain = 1 } = opts;
  const bufLen = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const noiseEnv = ac.createGain();
  noiseEnv.gain.setValueAtTime(peakGain, start);
  noiseEnv.gain.exponentialRampToValueAtTime(0.001, start + dur);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  noise.connect(filter);
  filter.connect(noiseEnv);
  noiseEnv.connect(out);
  noise.start(start);
  noise.stop(start + dur);
}

// ─── Per-theme configuration ────────────────────────────────────────────────

/** Frequency by adjacent mine count (higher count → higher pitch / tension). */
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

const SW_MINE_FREQ: Record<number, number> = {
  0: 196,
  1: 246,
  2: 294,
  3: 349,
  4: 392,
  5: 466,
  6: 554,
  7: 659,
  8: 784,
};

interface ThemeConfig {
  oscType: OscillatorType;
  reveal: {
    volMult: number;
    dur: number;
    attackTime: number;
    peakGain: number;
    freqMap: Record<number, number>;
  };
  whoosh: { volMult: number; dur: number };
  flag: {
    volMult: number;
    noteCount: number;
    gap: number;
    decay: number;
    freqs: number[];
    peakGain: number;
  };
  explode: {
    volMult: number;
    dur: number;
    oscType: OscillatorType;
    startFreq: number;
    filterFreq: number;
    includeNoise: boolean;
  };
  win: { volMult: number; spacing: number; noteDur: number; peakGain: number };
}

const THEME_CONFIGS: Record<SoundTheme, ThemeConfig> = {
  classic: {
    oscType: 'sine',
    reveal: { volMult: 0.4, dur: 0.07, attackTime: 0.01, peakGain: 0.6, freqMap: MINE_COUNT_FREQ },
    whoosh: { volMult: 0.35, dur: 0.2 },
    flag: { volMult: 0.45, noteCount: 2, gap: 0.04, decay: 0.05, freqs: [660, 880], peakGain: 0.3 },
    explode: {
      volMult: 0.7,
      dur: 0.5,
      oscType: 'sine',
      startFreq: 120,
      filterFreq: 1200,
      includeNoise: true,
    },
    win: { volMult: 0.5, spacing: 0.12, noteDur: 0.22, peakGain: 0.6 },
  },
  arcade: {
    oscType: 'square',
    reveal: { volMult: 0.4, dur: 0.06, attackTime: 0.003, peakGain: 0.8, freqMap: MINE_COUNT_FREQ },
    whoosh: { volMult: 0.35, dur: 0.2 },
    flag: { volMult: 0.45, noteCount: 2, gap: 0.03, decay: 0.05, freqs: [660, 880], peakGain: 0.5 },
    explode: {
      volMult: 0.7,
      dur: 0.5,
      oscType: 'sawtooth',
      startFreq: 120,
      filterFreq: 2000,
      includeNoise: true,
    },
    win: { volMult: 0.5, spacing: 0.09, noteDur: 0.22, peakGain: 0.8 },
  },
  minimal: {
    oscType: 'triangle',
    reveal: { volMult: 0.25, dur: 0.05, attackTime: 0.01, peakGain: 0.6, freqMap: MINE_COUNT_FREQ },
    whoosh: { volMult: 0.2, dur: 0.12 },
    flag: { volMult: 0.3, noteCount: 1, gap: 0.04, decay: 0.04, freqs: [660, 880], peakGain: 0.3 },
    explode: {
      volMult: 0.4,
      dur: 0.25,
      oscType: 'sine',
      startFreq: 80,
      filterFreq: 1200,
      includeNoise: false,
    },
    win: { volMult: 0.3, spacing: 0.12, noteDur: 0.12, peakGain: 0.6 },
  },
  starwars: {
    oscType: 'sawtooth',
    reveal: { volMult: 0.38, dur: 0.09, attackTime: 0.005, peakGain: 0.65, freqMap: SW_MINE_FREQ },
    whoosh: { volMult: 0.38, dur: 0.28 },
    flag: {
      volMult: 0.42,
      noteCount: 2,
      gap: 0.1,
      decay: 0.065,
      freqs: [900, 1200],
      peakGain: 0.55,
    },
    explode: {
      volMult: 0.65,
      dur: 0.6,
      oscType: 'sawtooth',
      startFreq: 2200,
      filterFreq: 1400,
      includeNoise: true,
    },
    win: { volMult: 0.48, spacing: 0.22, noteDur: 0.18, peakGain: 0.72 },
  },
};

// ─── Sound implementations ──────────────────────────────────────────────────

function playWhoosh(volume: number, theme: SoundTheme): void {
  const ac = getCtx();
  const cfg = THEME_CONFIGS[theme];
  const out = master(ac, volume * cfg.whoosh.volMult);
  const t = ac.currentTime;
  const dur = cfg.whoosh.dur;

  const isStarWars = theme === 'starwars';
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = isStarWars ? 'sawtooth' : cfg.oscType;
  osc.frequency.setValueAtTime(isStarWars ? 180 : 200, t);
  if (isStarWars) {
    osc.frequency.exponentialRampToValueAtTime(750, t + dur * 0.35);
    osc.frequency.exponentialRampToValueAtTime(220, t + dur);
  } else {
    osc.frequency.exponentialRampToValueAtTime(800, t + dur);
  }
  env.gain.setValueAtTime(isStarWars ? 0 : 0.5, t);
  if (isStarWars) {
    env.gain.linearRampToValueAtTime(0.7, t + 0.018);
  }
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playReveal(
  mineCount: number,
  cascadeSize: number,
  volume: number,
  theme: SoundTheme
): void {
  if (cascadeSize >= 6) {
    playWhoosh(volume, theme);
    return;
  }

  const ac = getCtx();
  const cfg = THEME_CONFIGS[theme];
  const { reveal } = cfg;
  const out = master(ac, volume * reveal.volMult);
  const t = ac.currentTime;
  const freq = reveal.freqMap[mineCount] ?? 880;

  // Main tone
  createTone(ac, out, {
    type: cfg.oscType,
    freq: freq * (theme === 'starwars' ? 1.6 : 2),
    freqEnd: freq,
    start: t,
    dur: reveal.dur,
    attack: reveal.attackTime,
    peakGain: reveal.peakGain,
  });

  // Star Wars: sub-octave hum for richness
  if (theme === 'starwars') {
    createTone(ac, out, {
      type: 'sine',
      freq: freq * 0.5,
      start: t,
      dur: reveal.dur + 0.03,
      attack: 0.001,
      peakGain: 0.28,
    });
  }

  // High mine count (7-8): dissonant second oscillator
  if (mineCount >= 7 && theme !== 'starwars') {
    createTone(ac, out, {
      type: cfg.oscType,
      freq: freq * 2 * 1.059,
      freqEnd: freq * 1.059,
      start: t,
      dur: reveal.dur,
      attack: reveal.attackTime,
      peakGain: 0.3,
    });
  }
}

function playFlag(volume: number, theme: SoundTheme): void {
  const ac = getCtx();
  const cfg = THEME_CONFIGS[theme];
  const { flag } = cfg;
  const out = master(ac, volume * flag.volMult);
  const t = ac.currentTime;

  if (theme === 'starwars') {
    // R2-D2 chirps: ascending sine sweeps
    const chirps = [
      { delay: 0.0, f0: 900, f1: 1400, dur: 0.065 },
      { delay: 0.1, f0: 1200, f1: 1800, dur: 0.055 },
    ];
    chirps.forEach(({ delay, f0, f1, dur }) => {
      createTone(ac, out, {
        type: 'sine',
        freq: f0,
        freqEnd: f1,
        start: t + delay,
        dur,
        attack: 0.006,
        peakGain: flag.peakGain,
      });
    });
    return;
  }

  for (let i = 0; i < flag.noteCount; i++) {
    const freq = flag.freqs[i] ?? 660;
    createTone(ac, out, {
      type: cfg.oscType,
      freq,
      start: t + i * flag.gap,
      dur: flag.decay,
      attack: 0.005,
      peakGain: flag.peakGain,
    });
  }
}

function playExplode(volume: number, theme: SoundTheme): void {
  const ac = getCtx();
  const cfg = THEME_CONFIGS[theme];
  const { explode } = cfg;
  const out = master(ac, volume * explode.volMult);
  const t = ac.currentTime;
  const dur = explode.dur;

  // Noise burst (not for minimal)
  if (explode.includeNoise) {
    createNoiseBurst(ac, out, {
      start: t,
      dur,
      filterFreq: explode.filterFreq,
      peakGain: theme === 'starwars' ? 0.7 : 1,
    });
  }

  // Pitch sweep oscillator
  const isStarWars = theme === 'starwars';
  const isMinimal = theme === 'minimal';
  const osc = ac.createOscillator();
  const oscEnv = ac.createGain();
  osc.type = explode.oscType;
  osc.frequency.setValueAtTime(explode.startFreq, t);

  if (isStarWars) {
    // TIE fighter scream: high → low sweep
    osc.frequency.exponentialRampToValueAtTime(70, t + dur * 0.55);
    oscEnv.gain.setValueAtTime(0.85, t);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
  } else {
    osc.frequency.exponentialRampToValueAtTime(isMinimal ? 25 : 30, t + dur * 0.6);
    oscEnv.gain.setValueAtTime(isMinimal ? 0.6 : 1, t);
    oscEnv.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
  }

  osc.connect(oscEnv);
  oscEnv.connect(out);
  osc.start(t);
  osc.stop(t + dur * (isStarWars ? 0.65 : 0.7));
}

function playWin(volume: number, theme: SoundTheme): void {
  const ac = getCtx();
  const cfg = THEME_CONFIGS[theme];
  const { win } = cfg;
  const out = master(ac, volume * win.volMult);
  const t = ac.currentTime;

  // Star Wars: Imperial March opening sting (G4 G4 G4 Eb4 Bb3 G4)
  const notes =
    theme === 'starwars'
      ? [
          { freq: 392.0, start: 0.0, dur: 0.18 },
          { freq: 392.0, start: 0.22, dur: 0.18 },
          { freq: 392.0, start: 0.44, dur: 0.18 },
          { freq: 311.13, start: 0.66, dur: 0.14 },
          { freq: 233.08, start: 0.82, dur: 0.05 },
          { freq: 392.0, start: 0.9, dur: 0.38 },
        ]
      : // Standard: C4 E4 G4 C5 arpeggio
        [261.63, 329.63, 392.0, 523.25].map((freq, i) => ({
          freq,
          start: i * win.spacing,
          dur: win.noteDur,
        }));

  notes.forEach(({ freq, start, dur }) => {
    createTone(ac, out, {
      type: theme === 'starwars' ? 'sawtooth' : cfg.oscType,
      freq,
      start: t + start,
      dur,
      attack: 0.012,
      peakGain: win.peakGain,
    });
  });
}

// ─── Public API ─────────────────────────────────────────────────────────────

export type SoundName = 'reveal' | 'flag' | 'explode' | 'win';

export interface SoundOptions {
  soundTheme?: SoundTheme;
  mineCount?: number;
  cascadeSize?: number;
}

export function playSound(name: SoundName, volume: number, options: SoundOptions = {}): void {
  const { soundTheme = 'classic', mineCount = 1, cascadeSize = 1 } = options;
  try {
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
  } catch (err: unknown) {
    // AudioContext unavailable (e.g. test env, restrictive browser policy) — expected
    if (err instanceof DOMException) {
      return;
    }
    // Unexpected error — log in dev to aid debugging
    if (import.meta.env.DEV) {
      console.warn('[sound.service] Unexpected error:', err);
    }
  }
}
