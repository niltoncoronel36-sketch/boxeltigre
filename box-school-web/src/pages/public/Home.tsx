import "./Home.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";


type Slide = { badge: string; title: string; highlight: string; text: string };

type Fighter = {
  id: string;
  name: string;
  nickname?: string;
  igHandle: string;
  igUrl: string;
  featuredPosts: string[];
};

type Fight = { a: Fighter; b: Fighter; weightClass?: string };

type EventItem = {
  id: string;
  title: string;
  dateText: string;
  place: string;
  poster?: string;
  note?: string;
  fights: Fight[];
};

type NewsItem = { id: string; title: string; source: string; time: string; url: string };

/* ===========================
   Partículas ancladas al HERO
=========================== */
function HeroParticlesCanvas({ lineRGB = "254,80,0" }: { lineRGB?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    const parent = canvas.parentElement;
    if (!parent) return;

    let w = 0,
      h = 0,
      dpr = 1;

    const pts: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    const LINK_DIST = 120;

    const resize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = parent.clientWidth;
      h = parent.clientHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      pts.length = 0;
      const count = Math.min(140, Math.max(70, Math.floor((w * h) / 22000)));
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.42,
          vy: (Math.random() - 0.5) * 0.42,
          r: Math.random() * 1.7 + 0.7,
        });
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.fill();
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i],
            b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const d = Math.sqrt(d2);
            const alpha = (1 - d / LINK_DIST) * 0.2;
            ctx.strokeStyle = `rgba(${lineRGB},${alpha})`;
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

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [lineRGB]);

  return <canvas ref={ref} className="home-hero__canvas" aria-hidden="true" />;
}

/* ===========================
   Instagram Embed
=========================== */
function useInstagramEmbedScript() {
  useEffect(() => {
    const id = "ig-embed-script";
    if (document.getElementById(id)) return;
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.defer = true;
    s.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(s);
  }, []);
}
function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    // @ts-ignore
    window?.instgrm?.Embeds?.process?.();
  }, [url]);

  return (
    <div style={{ width: "100%" }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ width: "100%", margin: "0 auto" }}
      />
    </div>
  );
}

/* ===========================
   Likes internos
=========================== */
const LIKE_KEY = "public_fighter_likes_v1";
type LikeState = { counts: Record<string, number>; liked: Record<string, boolean> };
function loadLikes(): LikeState {
  try {
    const raw = localStorage.getItem(LIKE_KEY);
    if (!raw) return { counts: {}, liked: {} };
    const parsed = JSON.parse(raw);
    return { counts: parsed?.counts ?? {}, liked: parsed?.liked ?? {} };
  } catch {
    return { counts: {}, liked: {} };
  }
}
function saveLikes(s: LikeState) {
  localStorage.setItem(LIKE_KEY, JSON.stringify(s));
}

export default function Home() {
  useInstagramEmbedScript();

  const WHATSAPP_TICKETS = "51947637782";

  const slides: Slide[] = useMemo(
    () => [
      {
        badge: "ACADEMIA • BOX",
        title: "Una escuela para",
        highlight: "formar campeones",
        text: "Disciplina, técnica y acompañamiento real. Construye confianza y mentalidad ganadora desde el primer día.",
      },
      {
        badge: "CLASES • TODOS LOS NIVELES",
        title: "Progresa con un",
        highlight: "plan medible",
        text: "Entrenamientos claros para principiantes y avanzados. Sube de nivel con un camino real de progreso.",
      },
      {
        badge: "EQUIPO • AMBIENTE",
        title: "Entrena en un",
        highlight: "lugar que inspira",
        text: "Un espacio que te exige y te cuida. Siente la diferencia en técnica, físico y confianza.",
      },
    ],
    []
  );

  const fighters: Fighter[] = useMemo(
    () => [
      {
        id: "f1",
        name: "Luis Ramírez",
        nickname: "El Tigre",
        igHandle: "eltigre.box",
        igUrl: "https://www.instagram.com/eltigre.box/",
        featuredPosts: ["https://www.instagram.com/p/XXXXXXXXXXX/"],
      },
      {
        id: "f2",
        name: "Carlos Soto",
        nickname: "La Furia",
        igHandle: "lafuria.box",
        igUrl: "https://www.instagram.com/lafuria.box/",
        featuredPosts: ["https://www.instagram.com/reel/YYYYYYYYYYY/"],
      },
      {
        id: "f3",
        name: "Miguel Herrera",
        nickname: "Rayo",
        igHandle: "rayo.box",
        igUrl: "https://www.instagram.com/rayo.box/",
        featuredPosts: ["https://www.instagram.com/p/ZZZZZZZZZZZ/"],
      },
      {
        id: "f4",
        name: "Diego Rojas",
        nickname: "Titan",
        igHandle: "titan.box",
        igUrl: "https://www.instagram.com/titan.box/",
        featuredPosts: ["https://www.instagram.com/reel/AAAAAAAAAAA/"],
      },
    ],
    []
  );

  const events: EventItem[] = useMemo(
    () => [
      {
        id: "velada-12",
        title: "Velada • Noche de Combates #12",
        dateText: "Sáb 24 Feb • 7:00 pm",
        place: "Lima • Coliseo Central",
        note: "Entradas limitadas • Cartelera oficial",
        poster: "/events/velada.png",
        fights: [
          { a: fighters[0], b: fighters[1], weightClass: "Peso Ligero" },
          { a: fighters[2], b: fighters[3], weightClass: "Peso Welter" },
        ],
      },
      {
        id: "sparring-ranking",
        title: "Sparring Oficial • Ranking Interno",
        dateText: "Dom 10 Mar • 5:30 pm",
        place: "Academia Box • Sede Principal",
        note: "Para alumnos avanzados • Cupos limitados",
        poster: "/events/sparring.png",
        fights: [{ a: fighters[1], b: fighters[2], weightClass: "Peso Medio" }],
      },
    ],
    [fighters]
  );

  const newsPE: NewsItem[] = useMemo(
    () => [
      { id: "n1", title: "Torneos y rankings nacionales: resumen", source: "Deportes Perú", time: "Hoy", url: "https://example.com/peru-1" },
      { id: "n2", title: "Claves para competir mejor: disciplina + constancia", source: "Box Perú", time: "Ayer", url: "https://example.com/peru-2" },
      { id: "n3", title: "Eventos de la semana: lo más destacado", source: "Noticias Lima", time: "Hace 2 días", url: "https://example.com/peru-3" },
    ],
    []
  );

  const newsWorld: NewsItem[] = useMemo(
    () => [
      { id: "w1", title: "Box internacional: peleas destacadas del fin de semana", source: "World Boxing", time: "Hoy", url: "https://example.com/world-1" },
      { id: "w2", title: "Tendencias: fuerza + velocidad + movilidad", source: "Fight Global", time: "Ayer", url: "https://example.com/world-2" },
      { id: "w3", title: "Carteleras anunciadas para el próximo mes", source: "Sports Now", time: "Hace 3 días", url: "https://example.com/world-3" },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [kenKey, setKenKey] = useState(0);

  // hero entry + video ready
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [heroIn, setHeroIn] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      setHeroIn(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHeroIn(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((p) => (p + 1) % slides.length);
      setKenKey((k) => k + 1);
    }, 7000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const [newsTab, setNewsTab] = useState<"pe" | "world">("pe");
  const [likes, setLikes] = useState<LikeState>(() => loadLikes());

  const toggleLike = (handle: string) => {
    setLikes((prev) => {
      const already = !!prev.liked[handle];
      const counts = { ...prev.counts };
      const liked = { ...prev.liked };
      liked[handle] = !already;
      counts[handle] = Math.max(0, Number(counts[handle] ?? 0) + (already ? -1 : 1));
      const next = { counts, liked };
      saveLikes(next);
      return next;
    });
  };

  const ticketLink = (ev: EventItem) => {
    const msg = `Hola, quiero comprar entradas para: ${ev.title} (${ev.dateText}) en ${ev.place}.`;
    return `https://wa.me/${WHATSAPP_TICKETS}?text=${encodeURIComponent(msg)}`;
  };

  /* ✅ alterna la dirección de la animación (izq/der) */
  const dirClass = active % 2 === 0 ? "home-copy--left" : "home-copy--right";

  return (
    <div className="home-page">
      {/* ============ HERO FULL BLEED (EXTREMO A EXTREMO) ============ */}
      <section className="home-bleed">
        <div ref={heroRef} className={`home-hero ${heroIn ? "is-in" : ""}`} id="inicio">
          <video
            className={`home-hero__video ${videoReady ? "is-ready" : ""}`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hero/hero-poster.jpg"
            onCanPlay={() => setVideoReady(true)}
          >
            <source src="/hero/hero.mp4" type="video/mp4" />
          </video>

          <div className="home-hero__shade" />
          <HeroParticlesCanvas lineRGB="254,80,0" />

          {/* contenido centrado */}
          <div className="home-hero__inner">
            <div className="home-hero__content">
              {/* ✅ animación SOLO de frase/título/texto */}
              <div key={`hero-copy-${active}-${kenKey}`} className={`home-copy ${dirClass}`}>
                <div className="home-badge">
                  <span className="home-badge__dot" />
                  <span>{slides[active].badge}</span>
                </div>

                <h1 className="home-hero__h1">
                  {slides[active].title} <span className="home-hero__accent">{slides[active].highlight}</span>
                </h1>

                <p className="home-hero__p">{slides[active].text}</p>
              </div>

              {/* ✅ CTA no cambia */}
              <div className="home-hero__build">
                <div className="home-hero__cta" id="unete">
                  <Link className="home-btn home-btn--accent" to="/servicios">
                    Ver servicios
                  </Link>
                  <Link className="home-btn home-btn--outline" to="/login">
                    Registrarme
                  </Link>
                  <Link className="home-btn home-btn--outline" to="/contacto">
                    Solicitar info
                  </Link>
                  <a className="home-btn home-btn--ghost" href="#veladas">
                    Ver veladas
                  </a>
                </div>

                <div className="home-hero__meta">
                  <span>✅ Entrenadores</span>
                  <span>✅ Plan de progreso</span>
                  <span>✅ Ambiente competitivo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="home-dots" aria-label="Cambiar frase">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`home-dot ${i === active ? "is-active" : ""}`}
                onClick={() => {
                  setActive(i);
                  setKenKey((k) => k + 1);
                }}
                aria-label={`Ir a frase ${i + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============ RESTO CENTRADO (1140px) ============ */}
      <section className="home-wrap">
        {/* VELADAS + NOTICIAS */}
        <div style={{ marginTop: 22 }} id="veladas">
          <div className="home-section">
            <div className="home-section__head">
              <h2 className="home-section__title">Veladas y Enfrentamientos</h2>
              <p className="home-section__text">
                Cartelera, peleadores destacados (Instagram + seguir) y compra de entradas por WhatsApp.
              </p>
            </div>

            <div className="home-grid-2">
              {/* VELADAS */}
              <div className="home-stack">
                {events.map((ev) => (
                  <div key={ev.id} className="home-card" style={{ overflow: "hidden" }}>
                    {ev.poster ? (
                      <div
                        className="home-poster"
                        style={{ backgroundImage: `url(${ev.poster})` }}
                        aria-label={ev.title}
                        role="img"
                      >
                        <div className="home-poster__shade" />
                        <div className="home-poster__text">
                          <div className="home-poster__title">{ev.title}</div>
                          <div className="home-muted">
                            {ev.dateText} • {ev.place}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="home-row-wrap">
                      <div className="home-h3">{ev.title}</div>
                      <div className="home-muted">{ev.dateText}</div>
                      <div className="home-muted">• {ev.place}</div>
                    </div>

                    {ev.note ? (
                      <div className="home-muted" style={{ marginTop: 6 }}>
                        {ev.note}
                      </div>
                    ) : null}

                    <div className="home-stack" style={{ marginTop: 10 }}>
                      {ev.fights.map((f, idx) => (
                        <div key={idx} className="home-card home-card--inner">
                          <div className="home-row-space">
                            <div className="home-strong">
                              {f.a.nickname ? f.a.nickname : f.a.name} <span className="home-muted">vs</span>{" "}
                              {f.b.nickname ? f.b.nickname : f.b.name}
                            </div>
                            {f.weightClass ? <div className="home-muted">{f.weightClass}</div> : null}
                          </div>

                          <div className="home-stack" style={{ marginTop: 10 }}>
                            {[f.a, f.b].map((x) => {
                              const handle = x.igHandle;
                              const likeCount = Number(likes.counts[handle] ?? 0);
                              const liked = !!likes.liked[handle];

                              return (
                                <div key={x.id} className="home-row-space">
                                  <div>
                                    <div className="home-strong">{x.name}</div>
                                    <div className="home-muted">@{x.igHandle}</div>
                                  </div>

                                  <div className="home-row-wrap" style={{ gap: 8 }}>
                                    <a className="home-btn home-btn--outline home-btn--sm" href={x.igUrl} target="_blank" rel="noreferrer">
                                      Seguir
                                    </a>

                                    <button
                                      className={`home-btn home-btn--sm ${liked ? "home-btn--accent" : "home-btn--outline"}`}
                                      type="button"
                                      onClick={() => toggleLike(handle)}
                                      title="Like interno"
                                    >
                                      ❤️ {likeCount}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="home-row-wrap" style={{ gap: 10, marginTop: 12 }}>
                      <Link className="home-btn home-btn--outline" to={`/veladas/${ev.id}`}>
                        Ver más
                      </Link>
                      <a className="home-btn home-btn--accent" href={ticketLink(ev)} target="_blank" rel="noreferrer">
                        Comprar entrada
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* NOTICIAS */}
              <div className="home-card home-sticky">
                <div className="home-row-space">
                  <div className="home-h3">Noticias</div>

                  <div className="home-row-wrap" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className={`home-btn home-btn--sm ${newsTab === "pe" ? "home-btn--accent" : "home-btn--outline"}`}
                      onClick={() => setNewsTab("pe")}
                    >
                      Perú
                    </button>
                    <button
                      type="button"
                      className={`home-btn home-btn--sm ${newsTab === "world" ? "home-btn--accent" : "home-btn--outline"}`}
                      onClick={() => setNewsTab("world")}
                    >
                      Internacional
                    </button>
                  </div>
                </div>

                <div className="home-stack" style={{ marginTop: 12 }}>
                  {(newsTab === "pe" ? newsPE : newsWorld).map((n) => (
                    <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="home-card home-card--inner home-link">
                      <div className="home-strong" style={{ lineHeight: 1.25 }}>
                        {n.title}
                      </div>
                      <div className="home-row-space home-muted" style={{ marginTop: 6 }}>
                        <span>{n.source}</span>
                        <span>{n.time}</span>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="home-muted" style={{ fontSize: 12, marginTop: 10 }}>
                  * Noticias de ejemplo. Luego se conectan a tu backend / feed real.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INSTAGRAM PELEADORES */}
        <div style={{ marginTop: 18 }}>
          <div className="home-section">
            <div className="home-section__head">
              <h2 className="home-section__title">Instagram de los peleadores</h2>
              <p className="home-section__text">Embed + seguir. “Like” es interno de tu web.</p>
            </div>

            <div className="home-grid-auto">
              {fighters.map((f) => {
                const handle = f.igHandle;
                const likeCount = Number(likes.counts[handle] ?? 0);
                const liked = !!likes.liked[handle];
                const firstPost = f.featuredPosts?.[0];

                return (
                  <div key={f.id} className="home-card home-stack">
                    <div className="home-row-space">
                      <div>
                        <div className="home-strong">{f.name}</div>
                        <div className="home-muted">@{f.igHandle}</div>
                      </div>

                      <div className="home-row-wrap" style={{ gap: 8 }}>
                        <a className="home-btn home-btn--outline home-btn--sm" href={f.igUrl} target="_blank" rel="noreferrer">
                          Seguir
                        </a>
                        <button
                          type="button"
                          className={`home-btn home-btn--sm ${liked ? "home-btn--accent" : "home-btn--outline"}`}
                          onClick={() => toggleLike(handle)}
                        >
                          ❤️ {likeCount}
                        </button>
                      </div>
                    </div>

                    {firstPost ? (
                      <div style={{ borderRadius: 16, overflow: "hidden" }}>
                        <InstagramEmbed url={firstPost} />
                      </div>
                    ) : (
                      <div className="home-card home-card--inner">
                        <div className="home-strong">Sin post destacado</div>
                        <div className="home-muted" style={{ marginTop: 6 }}>
                          Agrega una URL real en <code>featuredPosts</code>.
                        </div>
                      </div>
                    )}

                    <div className="home-muted" style={{ fontSize: 12 }}>
                      * “Like” aquí es interno. Para like real, Instagram requiere abrir su web/app.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
