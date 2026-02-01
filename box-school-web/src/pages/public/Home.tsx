import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Slide = {
  image: string;
  badge: string;
  title: string;
  highlight: string;
  text: string;
};

function ParticlesCanvas() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(parent.clientWidth * dpr);
      canvas.height = Math.floor(parent.clientHeight * dpr);
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const parent = canvas.parentElement!;
    const W = () => parent.clientWidth;
    const H = () => parent.clientHeight;

    const count = Math.max(60, Math.floor((W() * H()) / 18000)); // densidad adaptativa
    const pts = Array.from({ length: count }).map(() => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
    }));

    const step = () => {
      ctx.clearRect(0, 0, W(), H());

      // dots
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = W() + 20;
        if (p.x > W() + 20) p.x = -20;
        if (p.y < -20) p.y = H() + 20;
        if (p.y > H() + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fill();
      }

      // links (líneas suaves)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            const alpha = (1 - d / 110) * 0.22;
            ctx.strokeStyle = `rgba(255,106,0,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="pub-hero__canvas" aria-hidden="true" />;
}

export default function PublicHome() {
  const slides: Slide[] = useMemo(
    () => [
      {
        image: "/hero/slide-1.png",
        badge: "ACADEMIA • BOX",
        title: "Una escuela de box para",
        highlight: "formar campeones",
        text:
          "Disciplina, técnica y acompañamiento real. Aquí construyes confianza, carácter y una mentalidad ganadora desde el primer día.",
      },
      {
        image: "/hero/slide-2.png",
        badge: "CLASES • TODOS LOS NIVELES",
        title: "Aprende, progresa y",
        highlight: "supera tus límites",
        text:
          "Entrenamientos claros y medibles. Ideal para principiantes y avanzados: sube de nivel con un plan real de progreso.",
      },
      {
        image: "/hero/slide-3.png",
        badge: "EQUIPO • AMBIENTE",
        title: "Entrena en un",
        highlight: "lugar que inspira",
        text:
          "Un espacio que te exige y te cuida. Ven a probar una clase y siente la diferencia en técnica, físico y confianza.",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [kenKey, setKenKey] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((p) => (p + 1) % slides.length);
      setKenKey((k) => k + 1); // reinicia zoom elegante por slide
    }, 7000);

    return () => window.clearInterval(id);
  }, [slides.length]);

  return (
    <section className="pub-container">
      <div className="pub-hero" id="inicio">
        {slides.map((s, i) => (
          <div
            key={`${i}-${kenKey}`}
            className={`pub-hero__bg ${i === active ? "is-active is-kenburns" : ""}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}

        <div className="pub-hero__shade" />
        <ParticlesCanvas />

        <div className="pub-hero__content">
          <div className="pub-hero__badge">
            <span className="pub-hero__badge-dot" />
            <span>{slides[active].badge}</span>
          </div>

          <h1 className="pub-hero__h1">
            {slides[active].title}{" "}
            <span className="pub-hero__accent">{slides[active].highlight}</span>
          </h1>

          <p className="pub-hero__p">{slides[active].text}</p>

          <div className="pub-hero__cta" id="unete">
            <a className="pub-btn pub-btn--accent" href="/login">
              Únete ahora
            </a>

            <Link className="pub-btn pub-btn--outline" to="/contacto">
              Ver horarios
            </Link>

            <Link className="pub-btn pub-btn--outline" to="/login">
              Iniciar sesión
            </Link>
          </div>

          <div className="pub-hero__meta">
            <span>✅ Entrenadores</span>
            <span>✅ Plan de progreso</span>
            <span>✅ Ambiente competitivo</span>
          </div>
        </div>

        <div className="pub-dots" aria-label="Cambiar slide">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`pub-dot ${i === active ? "is-active" : ""}`}
              onClick={() => {
                setActive(i);
                setKenKey((k) => k + 1);
              }}
              aria-label={`Ir al slide ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
