import "./Servicios.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import ParticleBackdrop from "../../components/ui/ParticleBackdrop";

// -------------------- Types (Planes) --------------------
type Category = {
  id: number;
  name: string;
  level: string | null;
  min_age: number | null;
  max_age: number | null;
  capacity: number | null;
  monthly_fee_cents: number | null;
  is_active: boolean;
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function moneyFromCents(cents?: number | null) {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}
function cleanLevel(level?: string | null) {
  const s = (level ?? "").trim();
  return s ? s : "General";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = () => setReduced(!!mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

// ✅ Para assets en /public (funciona en Vite incluso si tu app tiene BASE_URL)
function withBase(path: string) {
  const base = (import.meta as any)?.env?.BASE_URL ?? "/";
  const b = String(base).endsWith("/") ? String(base) : `${base}/`;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return b + p;
}

// -------------------- Types (Categorías) --------------------
type CatItem = {
  key: string;
  name: string;
  age: string;
  title: string;
  focus: string;
  desc: string;
  tag: string;
  icon: string;
  img: string;
  accent?: boolean;
};

const CAT_ITEMS: CatItem[] = [
  {
    key: "femenino",
    name: "BOXEO FEMENINO",
    age: "Solo Damas",
    title: "Empoderamiento Real",
    focus: "Tonifica + defiéndete",
    desc: "Cardio y técnica real. Quema calorías, coordinación y seguridad.",
    tag: "Comunidad + seguridad personal.",
    icon: "🥊",
    img: "cats/femenino.png",
    accent: true,
  },
  {
    key: "kids",
    name: "KIDS",
    age: "06–10",
    title: "Seguridad y Valores",
    focus: "Disciplina + técnica base",
    desc: "Confianza, respeto y prevención del bullying con técnica adaptada.",
    tag: "Autoestima y anti-acoso.",
    icon: "🧒",
    img: "cats/kids.png",
  },
  {
    key: "junior",
    name: "JUNIOR",
    age: "11–17",
    title: "Carácter y Enfoque",
    focus: "Energía + técnica avanzada",
    desc: "Libera estrés, mejora condición y fortalece el carácter con disciplina.",
    tag: "Control emocional + forma física.",
    icon: "🔥",
    img: "cats/junior.png",
  },
  {
    key: "juvenil",
    name: "JUVENIL",
    age: "18–34",
    title: "Rendimiento Total",
    focus: "Potencia + defensa real",
    desc: "Entrenos intensos y técnica estratégica para verte y sentirte increíble.",
    tag: "Desestrés + confianza.",
    icon: "⚡",
    img: "cats/juvenil.png",
  },
  {
    key: "master",
    name: "MASTER",
    age: "35+",
    title: "Vitalidad y Salud",
    focus: "Estrategia + bienestar",
    desc: "Técnica inteligente, cuidado articular y cardio para longevidad activa.",
    tag: "Agilidad + salud mental.",
    icon: "🏅",
    img: "cats/master.png",
  },
];

// -------------------- Defensa Personal --------------------
type DefenseLevel = {
  key: "basico" | "intermedio" | "avanzado";
  badge: string;
  title: string;
  focus: string;
  bullets: string[];
  img?: string;
};

const DP_LEVELS: DefenseLevel[] = [
  {
    key: "basico",
    badge: "Nivel Básico",
    title: "Fundamentos de Seguridad",
    focus: "Aprender a caer, mantener la distancia y reaccionar ante una agresión.",
    bullets: [
      "Caídas y Rodamientos (Ukemi): evita lesiones al ser empujado o derribado.",
      "Posturas de Guardia: protege cuerpo y manos en un conflicto real.",
      "Proyecciones Básicas de Judo: desequilibra y derriba a un agresor más fuerte.",
      "Escapes de Piso: recupera la posición de pie de forma segura.",
      "Prevención y Conciencia: lectura del entorno para evitar riesgos.",
    ],
    img: "defensa/basico.png",
  },
  {
    key: "intermedio",
    badge: "Nivel Intermedio",
    title: "Control y Dominio",
    focus: "Manejo de distancia corta, agarres y control del oponente en el suelo.",
    bullets: [
      "Técnicas de Derribo Avanzadas: usa la fuerza del oponente (Judo) con precisión.",
      "Transiciones de Jiu-Jitsu: moverse y controlar en el piso con criterio.",
      "Defensa contra Agarres Comunes: escapes de abrazos, cuello o muñeca.",
      "Introducción a la Sumisión: llaves básicas y control para neutralizar.",
      "Resistencia Específica: fuerza y aire en forcejeo cercano.",
    ],
    img: "defensa/intermedio.png",
  },
  {
    key: "avanzado",
    badge: "Nivel Avanzado",
    title: "Neutralización y Respuesta Real",
    focus: "Aplicación bajo presión y resolución de situaciones críticas.",
    bullets: [
      "Luxaciones y Llaves de Finalización: perfeccionamiento para escenarios extremos.",
      "Combate en Escenarios Reales: simulacros bajo presión (seguro y controlado).",
      "Encadenamiento de Técnicas: fluidez de derribo (Judo) a control/sumisión (BJJ).",
      "Manejo del Estrés: entrenamiento bajo fatiga con adrenalina alta.",
      "Especialización: adaptación según peso, fuerza y estilo personal.",
    ],
    img: "defensa/avanzado.png",
  },
];

// -------------------- Testimonios --------------------
type Testimonial = {
  key: string;
  category: "KIDS" | "JUVENIL" | "BOXEO FEMENINO";
  person: string;
  name: string;
  mini: string;
  story: string[];
  results: string[];
  avatar: string;
  image: string;
  video?: string;
  accent?: boolean;
};

const TESTIMONIALS: Testimonial[] = [
  {
    key: "kids-mama",
    category: "KIDS",
    person: "Mamá",
    name: "Rosa M.",
    mini: "“Mi hijo (7) era tímido; en 3 meses ganó seguridad y ahora participa sin miedo.”",
    story: [
      "Antes, a mi hijo le costaba hablar con otros niños y evitaba actividades nuevas. En el colegio se quedaba callado y prefería no participar.",
      "En Kids empezó poco a poco: primero confianza, después disciplina y técnica adaptada. Lo que más noté fue su actitud: ahora se expresa mejor y camina con más seguridad.",
      "Me gustó que el enfoque no es solo físico: también trabajan respeto, control emocional y prevención del bullying.",
    ],
    results: ["Más confianza y comunicación", "Mejor postura y coordinación", "Respeto por normas y disciplina"],
    avatar: "testimonios/mama-kids.png",
    image: "testimonios/kids.png",
    video: "testimonios/kids-15s.mp4",
    accent: true,
  },
  {
    key: "juvenil-joven",
    category: "JUVENIL",
    person: "Joven",
    name: "Diego A.",
    mini: "“Entré sin condición; hoy tengo energía, foco y constancia. Me cambió la rutina.”",
    story: [
      "Yo buscaba algo que me saque del estrés y me obligue a ser constante. Al inicio me agotaba rápido y me frustraba.",
      "Con el plan Juvenil mejoré resistencia y técnica. Empecé a notar cambios reales: más energía en el día y mejor control en situaciones de presión.",
      "Lo mejor es el progreso medible: cada semana sientes que avanzas y eso te motiva a seguir.",
    ],
    results: ["Mejor cardio y fuerza", "Más enfoque y disciplina", "Menos estrés, más seguridad"],
    avatar: "testimonios/joven-juvenil.png",
    image: "testimonios/juvenil.png",
  },
  {
    key: "femenino-mujer",
    category: "BOXEO FEMENINO",
    person: "Alumna",
    name: "Valeria C.",
    mini: "“Ahora me siento segura: aprendí a reaccionar y a poner límites con confianza.”",
    story: [
      "Yo quería sentirme más segura al caminar sola y mejorar mi condición. No buscaba pelear: buscaba confianza.",
      "Aprendí técnica, movilidad y defensa personal aplicada. Lo importante fue sentir control: saber qué hacer, cómo moverme y cómo mantener distancia.",
      "Además, el ambiente es excelente: compañerismo, respeto y motivación real.",
    ],
    results: ["Más confianza y seguridad personal", "Mejor coordinación y movilidad", "Tonificación y energía"],
    avatar: "testimonios/mujer-femenino.png",
    image: "testimonios/femenino.png",
    accent: true,
  },
];

export default function Servicios() {
  // -------------------- Planes (API) --------------------
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const scopeRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const reducedMotion = useReducedMotion();

  // pausa solo cuando el usuario arrastra (planes)
  const pauseRef = useRef(false);
  const dragRef = useRef({
    down: false,
    startX: 0,
    startLeft: 0,
    pointerId: 0 as number | null,
  });

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const res = await api.get<Paginator<Category>>("/public/categories", {
        params: { per_page: 200, page: 1, active: 1, sort: "recommended" },
      });

      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(list);
    } catch (e: any) {
      setItems([]);
      setErr(e?.response?.data?.message ?? "No se pudieron cargar los planes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;

    return items.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const lvl = (c.level ?? "").toLowerCase();
      return name.includes(qq) || lvl.includes(qq);
    });
  }, [items, q]);

  // recomendado = mayor mensualidad
  const recommendedId = useMemo(() => {
    if (!filtered.length) return null;
    let best = filtered[0];
    for (const x of filtered) {
      if (Number(x.monthly_fee_cents ?? 0) > Number(best.monthly_fee_cents ?? 0)) best = x;
    }
    return best?.id ?? null;
  }, [filtered]);

  // duplicamos para loop infinito
  const loopList = useMemo(() => {
    if (!filtered.length) return [];
    const base = filtered;
    const times = Math.max(3, Math.ceil(12 / Math.max(1, base.length)));
    const out: Category[] = [];
    for (let i = 0; i < times; i++) out.push(...base);
    return [...out, ...out];
  }, [filtered]);

  // Reset scroll cuando cambia
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [loopList.length]);

  // Entrada primera sección (Planes)
  useEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.classList.add("sv-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          el.classList.add("sv-in");
          io.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  // Auto-scroll infinito (planes)
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (reducedMotion) return;

    let raf = 0;
    let last = performance.now();
    const pxPerSecond = 18;

    const tick = (t: number) => {
      const dt = t - last;
      last = t;

      if (!pauseRef.current && el.scrollWidth > el.clientWidth + 2) {
        el.scrollLeft += (dt * pxPerSecond) / 1000;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loopList.length, reducedMotion]);

  // Drag planes
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if ((e as any).button !== undefined && (e as any).button !== 0) return;

      pauseRef.current = true;
      dragRef.current.down = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startLeft = el.scrollLeft;
      dragRef.current.pointerId = e.pointerId;

      el.classList.add("sv-isDragging");
      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.down) return;
      const dx = e.clientX - dragRef.current.startX;
      el.scrollLeft = dragRef.current.startLeft - dx;
    };

    const end = () => {
      if (!dragRef.current.down) return;
      dragRef.current.down = false;
      el.classList.remove("sv-isDragging");
      window.setTimeout(() => (pauseRef.current = false), 700);
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  // Micro-tilt planes
  useEffect(() => {
    if (reducedMotion) return;

    const track = trackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>(".sv-card"));
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 8;
        card.style.setProperty("--rx", `${rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
        card.style.setProperty("--mx", `${Math.round(px * 100)}%`);
        card.style.setProperty("--my", `${Math.round(py * 100)}%`);
      };

      const onLeave = () => {
        card.style.setProperty("--rx", `0deg`);
        card.style.setProperty("--ry", `0deg`);
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [loopList.length, reducedMotion]);

  // -------------------- Categorías (Carrusel + video) --------------------
  const catsRef = useRef<HTMLElement | null>(null);
  const catsTrackRef = useRef<HTMLDivElement | null>(null);

  const catsPauseRef = useRef(false);
  const catsDragRef = useRef({
    down: false,
    startX: 0,
    startLeft: 0,
    pointerId: 0 as number | null,
  });

  const catsLoop = useMemo(() => {
    const base = CAT_ITEMS;
    const times = Math.max(3, Math.ceil(12 / Math.max(1, base.length)));
    const out: CatItem[] = [];
    for (let i = 0; i < times; i++) out.push(...base);
    return [...out, ...out];
  }, []);

  // Entrada categorías (en orden: solo si Planes ya entró)
  useEffect(() => {
    const el = catsRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.classList.add("sv-catsIn");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        const scope = scopeRef.current;
        if (scope && !scope.classList.contains("sv-in")) return;

        el.classList.add("sv-catsIn");
        io.disconnect();
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  // Reset scroll categorías
  useEffect(() => {
    const el = catsTrackRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [catsLoop.length]);

  // Auto-scroll categorías
  useEffect(() => {
    const el = catsTrackRef.current;
    if (!el) return;
    if (reducedMotion) return;

    let raf = 0;
    let last = performance.now();
    const pxPerSecond = 16;

    const tick = (t: number) => {
      const dt = t - last;
      last = t;

      if (!catsPauseRef.current && el.scrollWidth > el.clientWidth + 2) {
        el.scrollLeft += (dt * pxPerSecond) / 1000;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [catsLoop.length, reducedMotion]);

  // Drag categorías
  useEffect(() => {
    const el = catsTrackRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      if ((e as any).button !== undefined && (e as any).button !== 0) return;

      catsPauseRef.current = true;
      catsDragRef.current.down = true;
      catsDragRef.current.startX = e.clientX;
      catsDragRef.current.startLeft = el.scrollLeft;
      catsDragRef.current.pointerId = e.pointerId;

      el.classList.add("sv-isDragging");
      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!catsDragRef.current.down) return;
      const dx = e.clientX - catsDragRef.current.startX;
      el.scrollLeft = catsDragRef.current.startLeft - dx;
    };

    const end = () => {
      if (!catsDragRef.current.down) return;
      catsDragRef.current.down = false;
      el.classList.remove("sv-isDragging");
      window.setTimeout(() => (catsPauseRef.current = false), 700);
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  // Micro-tilt categorías
  useEffect(() => {
    if (reducedMotion) return;

    const track = catsTrackRef.current;
    if (!track) return;

    const cards = Array.from(track.querySelectorAll<HTMLElement>(".sv-catCard"));
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 8;
        card.style.setProperty("--rx", `${rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
        card.style.setProperty("--mx", `${Math.round(px * 100)}%`);
        card.style.setProperty("--my", `${Math.round(py * 100)}%`);
      };

      const onLeave = () => {
        card.style.setProperty("--rx", `0deg`);
        card.style.setProperty("--ry", `0deg`);
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        card.removeEventListener("mousemove", onMove);
        card.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [catsLoop.length, reducedMotion]);

  // -------------------- Defensa Personal --------------------
  const dpRef = useRef<HTMLElement | null>(null);
  const [dpKey, setDpKey] = useState<DefenseLevel["key"]>("basico");

  const dpActive = useMemo(() => DP_LEVELS.find((x) => x.key === dpKey) ?? DP_LEVELS[0], [dpKey]);

  // Entrada defensa (en orden: solo si Categorías ya entró)
  useEffect(() => {
    const el = dpRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.classList.add("sv-dpIn");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        const cats = catsRef.current;
        if (cats && !cats.classList.contains("sv-catsIn")) return;

        el.classList.add("sv-dpIn");
        io.disconnect();
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  const dpDiagram = withBase("defensa/diagrama.png");
  const dpHero = withBase("defensa/hero.png");

  // -------------------- Testimonios --------------------
  const tsRef = useRef<HTMLElement | null>(null);
  const [openT, setOpenT] = useState<Testimonial | null>(null);

  // Entrada testimonios (en orden: solo si Defensa ya entró)
  useEffect(() => {
    const el = tsRef.current;
    if (!el) return;

    if (reducedMotion) {
      el.classList.add("sv-tsIn");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        const dp = dpRef.current;
        if (dp && !dp.classList.contains("sv-dpIn")) return;

        el.classList.add("sv-tsIn");
        io.disconnect();
      },
      { threshold: 0.18 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  // Cerrar modal con ESC + bloquear scroll
  useEffect(() => {
    if (!openT) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenT(null);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openT]);

  // ✅ si reduced motion, marcamos todas en “in” (ordenado)
  useEffect(() => {
    if (!reducedMotion) return;

    scopeRef.current?.classList.add("sv-in");
    catsRef.current?.classList.add("sv-catsIn");
    dpRef.current?.classList.add("sv-dpIn");
    tsRef.current?.classList.add("sv-tsIn");
  }, [reducedMotion]);

  return (
    <section ref={scopeRef as any} className="sv-scope sv-enter">
      {/* ✅ Partículas detrás (NO TOCAR) */}
      <ParticleBackdrop dotColor="rgba(255,255,255,0.45)" lineRGB="255,106,0" maxDist={140} density={24000} />

      <div className="sv-container">
        {/* ===================== PLANES ===================== */}
        <header className="sv-head">
          <h2 className="sv-title">Planes y Membresías</h2>
          <p className="sv-sub">Elige el plan ideal para tu objetivo. Revisa edades, cupos y mensualidad antes de inscribirte.</p>

          <div className="sv-tools">
            <input className="sv-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por plan o nivel..." />
            <button className="sv-btn" type="button" onClick={load} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </button>
          </div>

          {err && <div className="sv-error">{err}</div>}
        </header>

        <div className="sv-carousel" aria-label="Carrusel de planes">
          <div className="sv-fade sv-fadeL" />
          <div className="sv-fade sv-fadeR" />

          {loading ? (
            <div className="sv-state">Cargando planes…</div>
          ) : filtered.length === 0 ? (
            <div className="sv-state">No hay planes para mostrar.</div>
          ) : (
            <div ref={trackRef} className="sv-track" role="list" aria-label="Arrastra para desplazar">
              {loopList.map((c, idx) => {
                const featured = recommendedId != null && c.id === recommendedId;
                const delay = reducedMotion ? 0 : (idx % Math.min(filtered.length, 10)) * 60;

                return (
                  <article
                    key={`${c.id}-${idx}`}
                    className={`sv-card sv-build ${featured ? "sv-featured" : ""}`}
                    role="listitem"
                    style={{ ["--d" as any]: `${delay}ms` }}
                  >
                    <div className={`sv-badge ${featured ? "sv-badgeAccent" : ""}`}>
                      <span className="sv-badgeDot" />
                      {featured ? "Recomendado" : "Plan"}
                    </div>

                    <div className="sv-name">{c.name}</div>

                    <div className="sv-level">
                      <span className="sv-pill">{cleanLevel(c.level)}</span>
                    </div>

                    <div className="sv-price">
                      {moneyFromCents(c.monthly_fee_cents)} <small>/ mes</small>
                    </div>

                    <div className="sv-list">
                      <div className="sv-li">
                        <span className="sv-dot" />
                        Edad: <b>{c.min_age ?? "—"}</b> a <b>{c.max_age ?? "—"}</b>
                      </div>
                      <div className="sv-li">
                        <span className="sv-dot" />
                        Cupos: <b>{c.capacity ?? "—"}</b>
                      </div>
                      <div className="sv-li">
                        <span className="sv-dot" />
                        Estado: <b>{c.is_active ? "Disponible" : "No disponible"}</b>
                      </div>
                    </div>

                    <div className="sv-actions">
                      <a className="sv-cta" href="/#unete">
                        Elegir plan
                      </a>
                      <a className="sv-ghost" href="/contacto">
                        Consultar
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && filtered.length > 0 && <div className="sv-note">Arrastra con el mouse/touch. El carrusel se mueve automáticamente.</div>}
        </div>
      </div>

      {/* ===================== CATEGORÍAS (video + carrusel) ===================== */}
      <section ref={catsRef as any} className="sv-catsBleed sv-cats-enter">
        <div className="sv-catsBg" aria-hidden="true">
          <video className="sv-catsVideo" src={withBase("hero/hero.mp4")} autoPlay muted loop playsInline />
          <div className="sv-catsOverlay" />
        </div>

        <div className="sv-container sv-catsInner">
          <header className="sv-catsHead">
            <h3 className="sv-catsTitle">Categorías</h3>
            <p className="sv-catsSub">Elige tu grupo por edad y objetivo. Técnica real, progreso y respeto.</p>
          </header>

          <div className="sv-catCarousel" aria-label="Carrusel de categorías">
            <div className="sv-fade sv-fadeL" />
            <div className="sv-fade sv-fadeR" />

            <div ref={catsTrackRef} className="sv-catTrack" role="list" aria-label="Arrastra para desplazar">
              {catsLoop.map((it, idx) => {
                const delay = reducedMotion ? 0 : (idx % Math.min(CAT_ITEMS.length, 10)) * 70;
                const imgSrc = withBase(it.img);

                return (
                  <article
                    key={`${it.key}-${idx}`}
                    className={`sv-catCard sv-catBuild ${it.accent ? "is-accent" : ""}`}
                    role="listitem"
                    style={{ ["--d" as any]: `${delay}ms` }}
                  >
                    <img
                      className="sv-catImg"
                      src={imgSrc}
                      alt=""
                      aria-hidden="true"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                    />

                    <div className="sv-catContent">
                      <div className="sv-catTop">
                        <div className="sv-catIcon">{it.icon}</div>

                        <div className="sv-catTopText">
                          <div className="sv-catName">{it.name}</div>
                          <div className="sv-catAgePill">{it.age}</div>
                        </div>

                        <div className="sv-catTag">{it.tag}</div>
                      </div>

                      <div className="sv-catTitle">{it.title}</div>

                      <div className="sv-catMeta">
                        <span className="sv-chip">Enfoque</span>
                        <span className="sv-catMetaTxt">{it.focus}</span>
                      </div>

                      <p className="sv-catDesc">{it.desc}</p>

                      <div className="sv-catFoot">
                        <div className="sv-catActions">
                          <a className="sv-ghost" href="/contacto">
                            Consultar
                          </a>
                          <a className="sv-cta" href="/#unete">
                            Inscribirme
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="sv-note sv-note--cats">Arrastra con el mouse/touch. Se mueve automáticamente.</div>
          </div>
        </div>
      </section>

      {/* ===================== 3.2 DEFENSA PERSONAL ===================== */}
      <section ref={dpRef as any} className="sv-dp sv-dp-enter" id="defensa-personal">
        <div className="sv-container">
          <header className="sv-dpHead">
            <div className="sv-dpKicker">3.2</div>
            <h3 className="sv-dpTitle">Defensa personal</h3>
            <p className="sv-dpSub">
              Nuestro curso de Defensa Personal es un programa integral diseñado para hombres y mujeres que buscan seguridad y confianza.
              Combinamos lo mejor del <b>Judo</b> y el <b>Jiu-Jitsu Brasileño</b>, enseñando técnicas de control y respuesta efectiva.
              Aceptamos alumnos desde los <b>8 años</b> en adelante, adaptando la enseñanza a cada etapa.
            </p>

            <div className="sv-dpBadges">
              <span className="sv-dpBadge">Judo + BJJ</span>
              <span className="sv-dpBadge sv-dpBadgeAccent">Desde 8 años</span>
              <span className="sv-dpBadge">Seguridad + Confianza</span>
            </div>
          </header>

          <div className="sv-dpGrid">
            {/* Lado visual */}
            <div className="sv-dpLeft">
              <div className="sv-dpCard sv-dpBuild" style={{ ["--d" as any]: `0ms` }}>
                <div className="sv-dpCardTop">
                  <div className="sv-dpCardTitle">Ruta de Niveles</div>
                  <div className="sv-dpCardHint">Básico → Intermedio → Avanzado</div>
                </div>

                <img
                  className="sv-dpDiagram"
                  src={dpDiagram}
                  alt="Defensa Personal → Niveles → Básico / Intermedio / Avanzado"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />

                <div className="sv-dpMiniNote">
                  Tip: sube tu diagrama como <b>public/defensa/diagrama.png</b>
                </div>
              </div>

              <div className="sv-dpPhotos sv-dpBuild" style={{ ["--d" as any]: `90ms` }}>
                <div className="sv-dpPhoto">
                  <img src={dpHero} alt="" aria-hidden="true" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
                  <div className="sv-dpPhotoCap">Foto hero (PNG)</div>
                </div>

                <div className="sv-dpPhoto">
                  <img
                    src={withBase("defensa/escena-1.png")}
                    alt=""
                    aria-hidden="true"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                  <div className="sv-dpPhotoCap">Entrenamiento</div>
                </div>

                <div className="sv-dpPhoto">
                  <img
                    src={withBase("defensa/escena-2.png")}
                    alt=""
                    aria-hidden="true"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                  <div className="sv-dpPhotoCap">Técnica</div>
                </div>
              </div>
            </div>

            {/* Lado contenido */}
            <div className="sv-dpRight">
              <div className="sv-dpTabs sv-dpBuild" style={{ ["--d" as any]: `40ms` }}>
                {DP_LEVELS.map((lv) => (
                  <button
                    key={lv.key}
                    type="button"
                    className={`sv-dpTab ${dpKey === lv.key ? "is-on" : ""}`}
                    onClick={() => setDpKey(lv.key)}
                    aria-selected={dpKey === lv.key}
                  >
                    {lv.badge}
                  </button>
                ))}
              </div>

              <div key={dpActive.key} className="sv-dpPanel sv-dpBuild" style={{ ["--d" as any]: `110ms` }}>
                <div className="sv-dpPanelTop">
                  <div className="sv-dpPanelBadge">{dpActive.badge}</div>
                  <div className="sv-dpPanelTitle">{dpActive.title}</div>
                  <div className="sv-dpPanelFocus">{dpActive.focus}</div>
                </div>

                {dpActive.img && (
                  <img
                    className="sv-dpLevelImg"
                    src={withBase(dpActive.img)}
                    alt=""
                    aria-hidden="true"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                )}

                <ul className="sv-dpList">
                  {dpActive.bullets.map((t, i) => (
                    <li key={i} className="sv-dpLi">
                      <span className="sv-dpDot" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="sv-dpCtas">
                  <a className="sv-ghost" href="/contacto">
                    Consultar
                  </a>
                  <a className="sv-cta" href="/#unete">
                    Inscribirme
                  </a>
                </div>

                <div className="sv-dpFootNote">
                  Entrenamiento progresivo: primero técnica segura, luego control y finalmente aplicación bajo presión (siempre supervisado).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 4. TESTIMONIOS ===================== */}
      <section ref={tsRef as any} className="sv-ts sv-ts-enter" id="testimonios">
        <div className="sv-container">
          <header className="sv-tsHead">
            <div className="sv-tsKicker">4</div>
            <h3 className="sv-tsTitle">Historias de Éxito</h3>
            <p className="sv-tsSub">Opiniones reales por categoría. No solo cambios físicos: también seguridad, disciplina y actitud.</p>
          </header>

          <div className="sv-tsGrid" role="list">
            {TESTIMONIALS.map((t, idx) => {
              const delay = reducedMotion ? 0 : idx * 90;
              return (
                <article
                  key={t.key}
                  role="listitem"
                  className={`sv-tsCard sv-tsBuild ${t.accent ? "is-accent" : ""}`}
                  style={{ ["--d" as any]: `${delay}ms` }}
                  onClick={() => setOpenT(t)}
                >
                  <div className="sv-tsTop">
                    <div className="sv-tsAvatar">
                      <img
                        src={withBase(t.avatar)}
                        alt={t.name}
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                      />
                    </div>

                    <div className="sv-tsTopText">
                      <div className="sv-tsName">{t.name}</div>
                      <div className="sv-tsMeta">
                        <span className="sv-tsPill">{t.category}</span>
                        <span className="sv-tsMetaTxt">{t.person}</span>
                      </div>
                    </div>

                    <div className="sv-tsOpenHint">Leer</div>
                  </div>

                  <div className="sv-tsQuote">{t.mini}</div>

                  <div className="sv-tsBottom">
                    <div className="sv-tsTag">Antes → Después</div>
                    <div className="sv-tsArrow">↗</div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="sv-note">Tip: Haz click en cualquier tarjeta para abrir la historia completa.</div>
        </div>

        {/* Modal */}
        {openT && (
          <div className="sv-modal" role="dialog" aria-modal="true" onMouseDown={() => setOpenT(null)}>
            <div className="sv-modalCard" onMouseDown={(e) => e.stopPropagation()}>
              <button className="sv-modalClose" type="button" onClick={() => setOpenT(null)} aria-label="Cerrar">
                ✕
              </button>

              <div className="sv-modalHead">
                <div className="sv-modalAvatar">
                  <img
                    src={withBase(openT.avatar)}
                    alt={openT.name}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                </div>

                <div className="sv-modalHeadText">
                  <div className="sv-modalName">{openT.name}</div>
                  <div className="sv-modalMeta">
                    <span className="sv-tsPill">{openT.category}</span>
                    <span className="sv-modalMetaTxt">{openT.person}</span>
                  </div>
                </div>
              </div>

              <div className="sv-modalQuote">{openT.mini}</div>

              <div className="sv-modalBody">
                {openT.story.map((p, i) => (
                  <p key={i} className="sv-modalP">
                    {p}
                  </p>
                ))}

                <div className="sv-modalResults">
                  <div className="sv-modalResultsTitle">Resultados destacados</div>
                  <ul className="sv-modalList">
                    {openT.results.map((r, i) => (
                      <li key={i} className="sv-modalLi">
                        <span className="sv-dpDot" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {openT.video && (
                  <div className="sv-modalVideo">
                    <div className="sv-modalResultsTitle">Video-testimonio (15s)</div>
                    <video controls playsInline preload="metadata">
                      <source src={withBase(openT.video)} type="video/mp4" />
                    </video>
                  </div>
                )}

                <div className="sv-modalImage">
                  <img
                    src={withBase(openT.image)}
                    alt=""
                    aria-hidden="true"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                </div>

                <div className="sv-modalCtas">
                  <a className="sv-ghost" href="/contacto">
                    Consultar
                  </a>
                  <a className="sv-cta" href="/#unete">
                    Inscribirme
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
