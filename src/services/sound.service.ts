/**
 * sound.service.ts
 *
 * Procedural sound effects via Web Audio API — no external audio files needed.
 * All sounds are generated on the fly and played through a shared AudioContext.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // Safari may suspend context until user gesture
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function master(ac: AudioContext, volume: number): GainNode {
  const g = ac.createGain()
  g.gain.value = Math.max(0, Math.min(1, volume))
  g.connect(ac.destination)
  return g
}

// --- Individual sound generators ---

function playReveal(volume: number): void {
  const ac = getCtx()
  const out = master(ac, volume * 0.4)
  const osc = ac.createOscillator()
  const env = ac.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(440, ac.currentTime + 0.06)

  env.gain.setValueAtTime(0.6, ac.currentTime)
  env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07)

  osc.connect(env)
  env.connect(out)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.08)
}

function playFlag(volume: number): void {
  const ac = getCtx()
  const out = master(ac, volume * 0.45)
  const t = ac.currentTime

  // Two short tones — feels like a "click-click"
  for (let i = 0; i < 2; i++) {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = 'square'
    osc.frequency.value = i === 0 ? 660 : 880
    env.gain.setValueAtTime(0, t + i * 0.04)
    env.gain.linearRampToValueAtTime(0.3, t + i * 0.04 + 0.005)
    env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.05)
    osc.connect(env)
    env.connect(out)
    osc.start(t + i * 0.04)
    osc.stop(t + i * 0.04 + 0.06)
  }
}

function playExplode(volume: number): void {
  const ac = getCtx()
  const out = master(ac, volume * 0.7)
  const t = ac.currentTime

  // White noise burst
  const bufLen = ac.sampleRate * 0.5
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

  const noise = ac.createBufferSource()
  noise.buffer = buf

  const noiseEnv = ac.createGain()
  noiseEnv.gain.setValueAtTime(1, t)
  noiseEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5)

  // Low thud
  const osc = ac.createOscillator()
  const oscEnv = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, t)
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.3)
  oscEnv.gain.setValueAtTime(1, t)
  oscEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.35)

  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200

  noise.connect(filter)
  filter.connect(noiseEnv)
  noiseEnv.connect(out)

  osc.connect(oscEnv)
  oscEnv.connect(out)

  noise.start(t)
  noise.stop(t + 0.5)
  osc.start(t)
  osc.stop(t + 0.35)
}

function playWin(volume: number): void {
  const ac = getCtx()
  const out = master(ac, volume * 0.5)
  const t = ac.currentTime

  // Short ascending arpeggio: C4 E4 G4 C5
  const notes = [261.63, 329.63, 392.0, 523.25]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const env = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = t + i * 0.12
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(0.6, start + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.22)
    osc.connect(env)
    env.connect(out)
    osc.start(start)
    osc.stop(start + 0.25)
  })
}

// --- Public API ---

export type SoundName = 'reveal' | 'flag' | 'explode' | 'win'

export function playSound(name: SoundName, volume: number): void {
  try {
    switch (name) {
      case 'reveal':
        playReveal(volume)
        break
      case 'flag':
        playFlag(volume)
        break
      case 'explode':
        playExplode(volume)
        break
      case 'win':
        playWin(volume)
        break
    }
  } catch {
    // AudioContext may not be available (e.g. in tests) — fail silently
  }
}
