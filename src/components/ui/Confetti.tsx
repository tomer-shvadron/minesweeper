import { useEffect, useRef } from 'react';

import { useGameStore } from '@/stores/game.store';
import { useSettingsStore } from '@/stores/settings.store';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const PARTICLE_COUNT = 80;
const RING_COUNT = 3;
const SPARKLE_COUNT = 12;
const DURATION_MS = 2600;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  opacity: number;
}

interface Ring {
  cx: number;
  cy: number;
  maxRadius: number;
  delay: number; // 0-1 delay factor
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  delay: number; // 0-1 delay factor
  color: string;
}

function createParticle(canvasWidth: number, canvasHeight: number): Particle {
  // Burst from center
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 6 + 2;
  return {
    x: cx + (Math.random() - 0.5) * 80,
    y: cy + (Math.random() - 0.5) * 80,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#f59e0b',
    width: Math.random() * 9 + 5,
    height: Math.random() * 6 + 3,
    opacity: 1,
  };
}

function createRing(canvasWidth: number, canvasHeight: number, index: number): Ring {
  return {
    cx: canvasWidth / 2,
    cy: canvasHeight / 2,
    maxRadius: Math.min(canvasWidth, canvasHeight) * (0.25 + index * 0.12),
    delay: index * 0.12,
  };
}

function createSparkle(canvasWidth: number, canvasHeight: number): Sparkle {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight * 0.7,
    size: Math.random() * 12 + 6,
    delay: Math.random() * 0.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#f59e0b',
  };
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  color: string
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', cx, cy);
  ctx.restore();
}

export const Confetti = () => {
  const status = useGameStore((s) => s.status);
  const gameKey = useGameStore((s) => s.gameKey);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    if (status !== 'won' || !animationsEnabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width, canvas.height)
    );
    const rings: Ring[] = Array.from({ length: RING_COUNT }, (_, i) =>
      createRing(canvas.width, canvas.height, i)
    );
    const sparkles: Sparkle[] = Array.from({ length: SPARKLE_COUNT }, () =>
      createSparkle(canvas.width, canvas.height)
    );

    const startTime = performance.now();
    let rafId: number;

    const draw = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw expanding rings
      for (const ring of rings) {
        const ringProgress = Math.max(0, Math.min(1, (progress - ring.delay) / 0.6));
        if (ringProgress <= 0) {
          continue;
        }
        const radius = ring.maxRadius * ringProgress;
        const alpha = (1 - ringProgress) * 0.35;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#fbbf24'; // golden
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ring.cx, ring.cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw confetti particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.vx *= 0.995;
        p.rotation += p.rotationSpeed;
        p.opacity = 1 - Math.pow(progress, 1.8);

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx.restore();
      }

      // Draw sparkles
      for (const s of sparkles) {
        const sparkleProgress = Math.max(0, Math.min(1, (progress - s.delay) / 0.4));
        if (sparkleProgress <= 0 || sparkleProgress >= 1) {
          continue;
        }
        const alpha = sparkleProgress < 0.5 ? sparkleProgress * 2 : (1 - sparkleProgress) * 2;
        const size = s.size * (0.5 + sparkleProgress * 0.5);
        drawStar(ctx, s.x, s.y, size, alpha, s.color);
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [status, gameKey, animationsEnabled]);

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
  );
};
