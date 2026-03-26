import { useEffect, useRef } from 'react'

import { useGameStore } from '@/stores/game.store'
import { useSettingsStore } from '@/stores/settings.store'

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
const PARTICLE_COUNT = 65
const DURATION_MS = 2400

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  color: string
  width: number
  height: number
  opacity: number
}

function createParticle(canvasWidth: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: -10,
    vx: (Math.random() - 0.5) * 3.5,
    vy: Math.random() * 3 + 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#f59e0b',
    width: Math.random() * 8 + 5,
    height: Math.random() * 5 + 3,
    opacity: 1,
  }
}

export const Confetti = () => {
  const status = useGameStore((s) => s.status)
  const gameKey = useGameStore((s) => s.gameKey)
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (status !== 'won' || !animationsEnabled) {
      return
    }
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width)
    )

    const startTime = performance.now()
    let rafId: number

    const draw = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / DURATION_MS, 1)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.06
        p.rotation += p.rotationSpeed
        p.opacity = 1 - Math.pow(progress, 2)

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        ctx.restore()
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [status, gameKey, animationsEnabled])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 102,
      }}
    />
  )
}
