import "./StudentHome.css";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import {
  CalendarClock,
  TrendingUp,
  CreditCard,
  GraduationCap,
  BarChart3,
  Receipt,
  Flame,
  MessageCircle,
  Store,
  User2,
  ShieldCheck,
} from "lucide-react";

function fmtDateLima(d: Date) {
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pickStr(...vals: any[]) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function TitleRow({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="stu-titleRow">
      <span className="stu-titleIcon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <div className="title">{children}</div>
    </div>
  );
}

function ActionButton({
  to,
  variant = "soft",
  icon: Icon,
  label,
}: {
  to: string;
  variant?: "primary" | "soft";
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link className={`stu-action ${variant}`} to={to}>
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stu-stat">
      <div className="stu-statLabel">{label}</div>
      <div className="stu-statValue">{value}</div>
    </div>
  );
}

export default function StudentHome() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return "Alumno";
    return pickStr((user as any)?.name, (user as any)?.nombre, (user as any)?.full_name, (user as any)?.email) || "Alumno";
  }, [user]);

  const email = useMemo(() => pickStr((user as any)?.email), [user]);
  const role = useMemo(() => pickStr((user as any)?.role_name, (user as any)?.role, "Alumno"), [user]);
  const today = useMemo(() => fmtDateLima(new Date()), []);

  // ✅ placeholders (luego los conectamos al API)
  const enrollmentLabel = "—";     // ej: “Boxeo (Intermedio)”
  const nextClass = "—";           // ej: “Mar 18:00”
  const nextPayment = "—";         // ej: “S/ 120 • 05/03/2026”
  const status = "ACTIVO";         // ej: ACTIVO/INACTIVO/PAUSADO

  return (
    <div className="stu-home">
      {/* HERO */}
      <div className="stu-hero card">
        <div className="stu-heroTop">
          <div className="stu-avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="stu-heroInfo">
            <div className="stu-hello">
              Hola, <span className="stu-name">{displayName}</span> 👋
            </div>
            <div className="stu-sub">
              {today}. Bienvenido a tu panel. Aquí verás tus clases, progreso y pagos.
            </div>

            <div className="stu-badges">
              <span className="stu-badge">
                <ShieldCheck size={14} /> {role.toUpperCase()}
              </span>
              <span className={`stu-badge ${status === "ACTIVO" ? "ok" : "warn"}`}>
                <span className="stu-dot" /> {status}
              </span>
            </div>
          </div>

          <div className="stu-heroRight">
            <div className="stu-miniCard">
              <div className="stu-miniTitle">
                <User2 size={16} /> Mi Perfil
              </div>
              <div className="stu-miniText">
                {email ? <>Correo: <b>{email}</b></> : "Completa tus datos para una mejor atención."}
              </div>
              <Link className="stu-miniBtn" to="/student/profile">
                Ver / Editar perfil
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="stu-stats">
          <MiniStat label="Matrícula" value={enrollmentLabel} />
          <MiniStat label="Próxima clase" value={nextClass} />
          <MiniStat label="Próxima cuota" value={nextPayment} />
        </div>

        {/* Actions */}
        <div className="stu-actions">
          <ActionButton to="/student/classes" variant="primary" icon={GraduationCap} label="Ver mis clases" />
          <ActionButton to="/student/progress" icon={BarChart3} label="Ver progreso" />
          <ActionButton to="/student/payments" icon={Receipt} label="Ver pagos" />
        </div>
      </div>

      {/* Cards */}
      <div className="stu-grid">
        <div className="card stu-card">
          <TitleRow icon={CalendarClock}>Próxima clase</TitleRow>
          <div className="muted stu-text">
            Aquí mostraremos tu próxima clase (cuando conectemos calendario/asistencias).
          </div>
          <Link className="stu-linkBtn" to="/student/classes">
            <CalendarClock size={18} /> Ver calendario
          </Link>
        </div>

        <div className="card stu-card">
          <TitleRow icon={TrendingUp}>Progreso</TitleRow>
          <div className="muted stu-text">
            Revisa tu evolución: constancia, objetivos, mejoras y seguimiento.
          </div>
          <Link className="stu-linkBtn" to="/student/progress">
            <TrendingUp size={18} /> Ver mi progreso
          </Link>
        </div>

        <div className="card stu-card">
          <TitleRow icon={CreditCard}>Pagos</TitleRow>
          <div className="muted stu-text">
            Consulta tus pagos, estado y próximas cuotas.
          </div>
          <Link className="stu-linkBtn" to="/student/payments">
            <CreditCard size={18} /> Ver pagos
          </Link>
        </div>
      </div>

      {/* Tips / CTA */}
      <div className="card stu-tips">
        <TitleRow icon={Flame}>Tips del día</TitleRow>

        <div className="muted stu-tipText">
          • Llega 10 min antes para calentar bien.<br />
          • Técnica primero, potencia después.<br />
          • Constancia = progreso real.
        </div>

        <div className="stu-cta">
          <a className="stu-ctaBtn primary" href="/contacto" target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> Consultar por WhatsApp
          </a>

          <Link className="stu-ctaBtn" to="/tienda">
            <Store size={18} /> Ver tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
