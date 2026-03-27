import type { SoundTheme } from '@/types/settings.types'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  // Safari may suspend context until user gesture
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function master(ac: AudioContext, volume: number): GainNode {
  const g = ac.createGain()
  g.gain.value = Math.max(0, Math.min(1, volume))
  g.connect(ac.destination)
  return g
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
}

type OscType = OscillatorType

function oscType(soundTheme: SoundTheme): OscType {
  if (soundTheme === 'arcade') {
    return 'square'
  }
  if (soundTheme === 'minimal') {
    return 'triangle'
  }
  return 'sine'
}

function playWhoosh(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx()
  const volMult = soundTheme === 'minimal' ? 0.2 : 0.35
  const out = master(ac, volume * volMult)
  const t = ac.currentTime
  const dur = soundTheme === 'minimal' ? 0.12 : 0.2

  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = oscType(soundTheme)
  osc.frequency.setValueAtTime(200, t)
  osc.frequency.exponentialRampToValueAtTime(800, t + dur)

  env.gain.setValueAtTime(0.5, t)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur)

  osc.connect(env)
  env.connect(out)
  osc.start(t)
  osc.stop(t + dur)
}

function playReveal(
  mineCount: number,
  cascadeSize: number,
  volume: number,
  soundTheme: SoundTheme
): void {
  // Cascade whoosh: flood-fill revealed ≥ 6 cells at once
  if (cascadeSize >= 6) {
    playWhoosh(volume, soundTheme)
    return
  }

  const ac = getCtx()
  const volMult = soundTheme === 'minimal' ? 0.25 : 0.4
  const out = master(ac, volume * volMult)
  const t = ac.currentTime
  const dur = soundTheme === 'minimal' ? 0.05 : soundTheme === 'arcade' ? 0.06 : 0.07
  const freq = MINE_COUNT_FREQ[mineCount] ?? 880

  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = oscType(soundTheme)
  osc.frequency.setValueAtTime(freq * 2, t)
  osc.frequency.exponentialRampToValueAtTime(freq, t + dur)

  const attackEnd = t + (soundTheme === 'arcade' ? 0.003 : 0.01)
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.8 : 0.6, attackEnd)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02)

  osc.connect(env)
  env.connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.03)

  // High mine count (7-8): add a dissonant second oscillator
  if (mineCount >= 7) {
    const osc2 = ac.createOscillator()
    const env2 = ac.createGain()
    osc2.type = oscType(soundTheme)
    // Minor second interval (~1.06× = ~100 cents sharp)
    osc2.frequency.setValueAtTime(freq * 2 * 1.059, t)
    osc2.frequency.exponentialRampToValueAtTime(freq * 1.059, t + dur)
    env2.gain.setValueAtTime(0, t)
    env2.gain.linearRampToValueAtTime(0.3, attackEnd)
    env2.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02)
    osc2.connect(env2)
    env2.connect(out)
    osc2.start(t)
    osc2.stop(t + dur + 0.03)
  }
}

function playFlag(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx()
  const volMult = soundTheme === 'minimal' ? 0.3 : 0.45
  const out = master(ac, volume * volMult)
  const t = ac.currentTime
  const noteCount = soundTheme === 'minimal' ? 1 : 2
  const freqs = [660, 880]
  const gap = soundTheme === 'arcade' ? 0.03 : 0.04
  const decay = soundTheme === 'minimal' ? 0.04 : 0.05

  for (let i = 0; i < noteCount; i++) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    const freq = freqs[i] ?? 660
    osc.type = oscType(soundTheme)
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, t + i * gap)
    env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.5 : 0.3, t + i * gap + 0.005)
    env.gain.exponentialRampToValueAtTime(0.001, t + i * gap + decay)
    osc.connect(env)
    env.connect(out)
    osc.start(t + i * gap)
    osc.stop(t + i * gap + decay + 0.01)
  }
}

function playExplode(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx()
  const volMult = soundTheme === 'minimal' ? 0.4 : 0.7
  const out = master(ac, volume * volMult)
  const t = ac.currentTime
  const dur = soundTheme === 'minimal' ? 0.25 : 0.5

  if (soundTheme !== 'minimal') {
    const bufLen = ac.sampleRate * dur
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ac.createBufferSource()
    noise.buffer = buf
    const noiseEnv = ac.createGain()
    noiseEnv.gain.setValueAtTime(1, t)
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + dur)
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = soundTheme === 'arcade' ? 2000 : 1200
    noise.connect(filter)
    filter.connect(noiseEnv)
    noiseEnv.connect(out)
    noise.start(t)
    noise.stop(t + dur)
  }

  const osc = ac.createOscillator()
  const oscEnv = ac.createGain()
  osc.type = soundTheme === 'arcade' ? 'sawtooth' : 'sine'
  const startFreq = soundTheme === 'minimal' ? 80 : 120
  osc.frequency.setValueAtTime(startFreq, t)
  osc.frequency.exponentialRampToValueAtTime(soundTheme === 'minimal' ? 25 : 30, t + dur * 0.6)
  oscEnv.gain.setValueAtTime(soundTheme === 'minimal' ? 0.6 : 1, t)
  oscEnv.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7)
  osc.connect(oscEnv)
  oscEnv.connect(out)
  osc.start(t)
  osc.stop(t + dur * 0.7)
}

function playWin(volume: number, soundTheme: SoundTheme): void {
  const ac = getCtx()
  const volMult = soundTheme === 'minimal' ? 0.3 : 0.5
  const out = master(ac, volume * volMult)
  const t = ac.currentTime

  // C4 E4 G4 C5 arpeggio
  const notes = [261.63, 329.63, 392.0, 523.25]
  const spacing = soundTheme === 'arcade' ? 0.09 : 0.12
  const noteDur = soundTheme === 'minimal' ? 0.12 : 0.22

  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = oscType(soundTheme)
    osc.frequency.value = freq
    const start = t + i * spacing
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(soundTheme === 'arcade' ? 0.8 : 0.6, start + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, start + noteDur)
    osc.connect(env)
    env.connect(out)
    osc.start(start)
    osc.stop(start + noteDur + 0.03)
  })
}

export type SoundName = 'reveal' | 'flag' | 'explode' | 'win'

export interface SoundOptions {
  soundTheme?: SoundTheme
  mineCount?: number
  cascadeSize?: number
}

export function playSound(name: SoundName, volume: number, options: SoundOptions = {}): void {
  const { soundTheme = 'classic', mineCount = 1, cascadeSize = 1 } = options
  try {
    switch (name) {
      case 'reveal':
        playReveal(mineCount, cascadeSize, volume, soundTheme)
        break
      case 'flag':
        playFlag(volume, soundTheme)
        break
      case 'explode':
        playExplode(volume, soundTheme)
        break
      case 'win':
        playWin(volume, soundTheme)
        break
    }
  } catch {
    // AudioContext may not be available (e.g. in tests) — fail silently
  }
}
