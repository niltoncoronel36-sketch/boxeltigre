import { useEffect, useMemo, useRef } from "react";

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

type Props = {
  dotColor?: string; // rgba
  lineRGB?: string; // "254,80,0" (sin alpha)
  maxDist?: number;
  density?: number;
  className?: string;
};

export default function ParticleBackdrop({
  dotColor = "rgba(255,255,255,0.55)",
  lineRGB = "254,80,0", // ✅ combina con tu #fe5000
  maxDist = 140,
  density = 24000,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const particles: Particle[] = [];

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;

      const count = Math.min(120, Math.max(35, Math.floor((w * h) / density)));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.55,
          r: 1 + Math.random() * 1.6,
        });
      }

      if (reduceMotion) drawFrame(true);
    };

    const drawFrame = (staticOnly = false) => {
      ctx.clearRect(0, 0, w, h);

      // dots
      for (const p of particles) {
        if (!staticOnly) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x <= 0 || p.x >= w) p.vx *= -1;
          if (p.y <= 0 || p.y >= h) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
      }

      // lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = 1 - dist / maxDist;
            ctx.strokeStyle = `rgba(${lineRGB},${0.12 * alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      drawFrame(false);
      rafRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);

    if (!reduceMotion) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion, dotColor, lineRGB, maxDist, density]);

  return <canvas ref={canvasRef} className={`sv-particles ${className}`} aria-hidden="true" />;
}
