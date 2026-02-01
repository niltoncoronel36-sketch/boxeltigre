import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./login.css";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export default function LoginPage() {
  const { user, signIn, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

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

      const count = Math.min(120, Math.max(35, Math.floor((w * h) / 22000)));
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

      for (const p of particles) {
        if (!staticOnly) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x <= 0 || p.x >= w) p.vx *= -1;
          if (p.y <= 0 || p.y >= h) p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.60)";
        ctx.fill();
      }

      const maxDist = 130;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = 1 - dist / maxDist;
            ctx.strokeStyle = `rgba(255,106,0,${0.12 * alpha})`;
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
  }, [reduceMotion]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // ✅ signIn retorna void y lanza error si falla
      await signIn(identifier, password);

      const from = (location.state as any)?.from?.pathname ?? "/home";
      navigate(from, { replace: true });
    } catch {
      // ✅ el error ya lo maneja AuthContext (error state)
    }
  };

  // ✅ si ya está logueado, manda al home/redirect
  if (!loading && user) return <Navigate to="/home" replace />;

  return (
    <div className="login-master-container">
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />

      <div className="login-shell">
        <section className="login-hero">
          <div className="brand-tag">SISTEMA ELITE V3.0</div>
          <h1 className="hero-title">
            Entrena. <br />
            <span className="orange-text">Compite.</span> <br />
            <span className="white-text">Gestiona.</span>
          </h1>
          <p className="hero-sub">
            Panel de administración Box School. Gestión deportiva de alto rendimiento.
          </p>
        </section>

        <section className="login-card-area">
          <div className="elite-card glass-card">
            <div className="orb-ring" aria-hidden="true" />
            <div className="orange-scanner" aria-hidden="true" />

            {/* ✅ LOGO en public */}
            <div className="logo-wrap">
              <img className="login-logo" src="/hero/logo.png" alt="Logo" />
            </div>

            <div className="card-header">
              <h2>ACCESO SEGURO</h2>
              <div className="header-divider"></div>
            </div>

            <form onSubmit={onSubmit} className="elite-form" noValidate>
              <div className="input-group">
                <label htmlFor="identifier">USUARIO / DNI</label>
                <input
                  id="identifier"
                  type="text"
                  className="elite-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Introduce tu identidad"
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">CONTRASEÑA</label>
                <input
                  id="password"
                  type="password"
                  className="elite-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="error-alert" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <button className="btn-main" type="submit" disabled={loading} aria-busy={loading}>
                {loading ? "SINCRONIZANDO..." : "INGRESAR AL SISTEMA"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
