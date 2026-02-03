import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

type Slide = {
  image: string;
  badge: string;
  title: string;
  highlight: string;
  text: string;
};

type Fighter = {
  id: string;
  name: string;
  nickname?: string;
  igHandle: string; // sin @
  igUrl: string; // https://instagram.com/...
  featuredPosts: string[]; // urls de posts/reels para embed
};

type Fight = {
  a: Fighter;
  b: Fighter;
  weightClass?: string;
};

type EventItem = {
  id: string;
  title: string;
  dateText: string; // "Sáb 24 Feb • 7:00 pm"
  place: string;
  poster?: string; // ✅ imagen cuadrada 1:1
  note?: string;
  fights: Fight[];
};

type NewsItem = {
  id: string;
  title: string;
  source: string;
  time: string; // "Hoy"
  url: string;
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
    const parent = canvas.parentElement;
    if (!parent) return;

    let w = 0,
      h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = parent.clientWidth;
      h = parent.clientHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const count = Math.max(60, Math.floor((w * h) / 22000));
    const pts = Array.from({ length: count }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
    }));

    const LINK_DIST = 95;

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
        ctx.fillStyle = "rgba(255,255,255,0.32)";
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
            const alpha = (1 - d / LINK_DIST) * 0.22;
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

/* ===========================
   Instagram Embed (posts/reels)
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
   Likes internos (tu web)
=========================== */
const LIKE_KEY = "public_fighter_likes_v1";

type LikeState = {
  counts: Record<string, number>;
  liked: Record<string, boolean>;
};

function loadLikes(): LikeState {
  try {
    const raw = localStorage.getItem(LIKE_KEY);
    if (!raw) return { counts: {}, liked: {} };
    const parsed = JSON.parse(raw);
    return {
      counts: parsed?.counts ?? {},
      liked: parsed?.liked ?? {},
    };
  } catch {
    return { counts: {}, liked: {} };
  }
}

function saveLikes(s: LikeState) {
  localStorage.setItem(LIKE_KEY, JSON.stringify(s));
}

export default function PublicHome() {
  useInstagramEmbedScript();

  // ✅ Cambia este número por el tuyo (sin espacios)
  const WHATSAPP_TICKETS = "51947637782";

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

  // ✅ Ejemplo peleadores (reemplaza con los reales)
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

  // ✅ Veladas (imagenes cuadradas)
  const events: EventItem[] = useMemo(
    () => [
      {
        id: "velada-12",
        title: "Velada • Noche de Combates #12",
        dateText: "Sáb 24 Feb • 7:00 pm",
        place: "Lima • Coliseo Central",
        note: "Entradas limitadas • Cartelera oficial",
        poster: "/events/velada.png", // ✅ cuadrada 1:1 (ponla en public/events/)
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

  // ✅ Noticias ejemplo (luego conectamos a backend)
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

  return (
    <section className="pub-container">
      {/* ================= HERO ================= */}
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
            {slides[active].title} <span className="pub-hero__accent">{slides[active].highlight}</span>
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

      {/* ================= SECCIÓN VELADAS + NOTICIAS ================= */}
      <div style={{ marginTop: 22 }} id="veladas">
        <div className="pub-section">
          <div className="pub-section__head">
            <h2 className="pub-section__title">Veladas y Enfrentamientos</h2>
            <p className="pub-section__text">
              Enfrentamientos organizados, cartelera y peleadores destacados (Instagram + seguir).
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr",
              gap: 14,
              alignItems: "start",
            }}
          >
            {/* ======= VELADAS ======= */}
            <div style={{ display: "grid", gap: 12 }}>
              {events.map((ev) => (
                <div key={ev.id} className="pub-card" style={{ overflow: "hidden" }}>
                  {/* ✅ Poster cuadrado 1:1 */}
                  {ev.poster ? (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundImage: `url(${ev.poster})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        position: "relative",
                        marginBottom: 12,
                      }}
                      aria-label={ev.title}
                      role="img"
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.02) 35%, rgba(0,0,0,0.70) 100%)",
                        }}
                      />
                      <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
                        <div style={{ fontWeight: 950, fontSize: 16, lineHeight: 1.1 }}>{ev.title}</div>
                        <div className="pub-muted" style={{ marginTop: 4 }}>
                          {ev.dateText} • {ev.place}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                      <div style={{ fontWeight: 950, fontSize: 18 }}>{ev.title}</div>
                      <div className="pub-muted">{ev.dateText}</div>
                      <div className="pub-muted">• {ev.place}</div>
                    </div>

                    {ev.note ? <div className="pub-muted">{ev.note}</div> : null}

                    <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
                      {ev.fights.map((f, idx) => (
                        <div
                          key={idx}
                          className="pub-card"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.10)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 900 }}>
                              {f.a.nickname ? f.a.nickname : f.a.name}{" "}
                              <span className="pub-muted" style={{ fontWeight: 700 }}>
                                vs
                              </span>{" "}
                              {f.b.nickname ? f.b.nickname : f.b.name}
                            </div>
                            {f.weightClass ? <div className="pub-muted">{f.weightClass}</div> : null}
                          </div>

                          {/* Peleadores con IG + Like interno */}
                          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                            {[f.a, f.b].map((x) => {
                              const handle = x.igHandle;
                              const likeCount = Number(likes.counts[handle] ?? 0);
                              const liked = !!likes.liked[handle];

                              return (
                                <div
                                  key={x.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div style={{ fontWeight: 900 }}>{x.name}</div>
                                    <div className="pub-muted">@{x.igHandle}</div>
                                  </div>

                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <a
                                      className="pub-btn pub-btn--outline pub-btn--sm"
                                      href={x.igUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Abrir Instagram"
                                    >
                                      Seguir
                                    </a>

                                    <button
                                      className={`pub-btn pub-btn--sm ${liked ? "pub-btn--accent" : "pub-btn--outline"}`}
                                      type="button"
                                      onClick={() => toggleLike(handle)}
                                      title="Like interno en tu web"
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

                    {/* ✅ Botones correctos */}
                    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                      <Link className="pub-btn pub-btn--outline" to={`/veladas/${ev.id}`}>
                        Ver más
                      </Link>

                      <a className="pub-btn pub-btn--accent" href={ticketLink(ev)} target="_blank" rel="noreferrer">
                        Comprar entrada
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ======= NOTICIAS ======= */}
            <div className="pub-card" style={{ position: "sticky", top: 90 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 950, fontSize: 16 }}>Noticias</div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={`pub-btn pub-btn--sm ${newsTab === "pe" ? "pub-btn--accent" : "pub-btn--outline"}`}
                    onClick={() => setNewsTab("pe")}
                  >
                    Perú
                  </button>
                  <button
                    type="button"
                    className={`pub-btn pub-btn--sm ${newsTab === "world" ? "pub-btn--accent" : "pub-btn--outline"}`}
                    onClick={() => setNewsTab("world")}
                  >
                    Internacional
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(newsTab === "pe" ? newsPE : newsWorld).map((n) => (
                  <a
                    key={n.id}
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pub-card"
                    style={{
                      textDecoration: "none",
                      display: "grid",
                      gap: 6,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                    title="Abrir noticia"
                  >
                    <div style={{ fontWeight: 900, lineHeight: 1.25 }}>{n.title}</div>
                    <div className="pub-muted" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span>{n.source}</span>
                      <span>{n.time}</span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="pub-muted" style={{ fontSize: 12, marginTop: 10 }}>
                * Noticias de ejemplo. Luego se conectan a tu backend / feed real.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= INSTAGRAM PELEADORES ================= */}
      <div style={{ marginTop: 18 }}>
        <div className="pub-section">
          <div className="pub-section__head">
            <h2 className="pub-section__title">Instagram de los peleadores</h2>
            <p className="pub-section__text">
              Vista dentro de la web (embed) + seguir. “Like” es interno de tu web.
            </p>
          </div>

          <div
            className="pub-store-grid"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            }}
          >
            {fighters.map((f) => {
              const handle = f.igHandle;
              const likeCount = Number(likes.counts[handle] ?? 0);
              const liked = !!likes.liked[handle];
              const firstPost = f.featuredPosts?.[0];

              return (
                <div key={f.id} className="pub-card" style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 950 }}>{f.name}</div>
                      <div className="pub-muted">@{f.igHandle}</div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a className="pub-btn pub-btn--outline pub-btn--sm" href={f.igUrl} target="_blank" rel="noreferrer">
                        Seguir
                      </a>
                      <button
                        type="button"
                        className={`pub-btn pub-btn--sm ${liked ? "pub-btn--accent" : "pub-btn--outline"}`}
                        onClick={() => toggleLike(handle)}
                        title="Like interno en tu web"
                      >
                        ❤️ {likeCount}
                      </button>
                    </div>
                  </div>

                  {firstPost ? (
                    <div style={{ borderRadius: 14, overflow: "hidden" }}>
                      <InstagramEmbed url={firstPost} />
                    </div>
                  ) : (
                    <div className="pub-card" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ fontWeight: 900 }}>Sin post destacado</div>
                      <div className="pub-muted" style={{ marginTop: 6 }}>
                        Agrega una URL real en <code>featuredPosts</code>.
                      </div>
                    </div>
                  )}

                  <div className="pub-muted" style={{ fontSize: 12 }}>
                    * “Like” aquí es interno. Para seguir/like real, Instagram requiere abrir su web/app.
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
