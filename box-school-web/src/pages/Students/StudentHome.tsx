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
} from "lucide-react";

function fmtDateLima(d: Date) {
  return d.toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TitleRow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Icon size={18} />
      <div className="title">{children}</div>
    </div>
  );
}

export default function StudentHome() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return "Alumno";
    return (
      (user as any)?.name ||
      (user as any)?.nombre ||
      (user as any)?.full_name ||
      (user as any)?.email ||
      "Alumno"
    );
  }, [user]);

  const today = useMemo(() => fmtDateLima(new Date()), []);

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* Header */}
      <div className="card">
        <div className="title" style={{ fontSize: 18 }}>
          Hola, {displayName} 👋
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          {today}. Bienvenido a tu panel. Aquí verás tus clases, progreso y pagos.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="btn btn-primary" to="/student/classes">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <GraduationCap size={18} />
              Ver mis clases
            </span>
          </Link>

          <Link className="btn" to="/student/progress">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={18} />
              Ver progreso
            </span>
          </Link>

          <Link className="btn" to="/student/payments">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Receipt size={18} />
              Ver pagos
            </span>
          </Link>
        </div>
      </div>

      {/* Cards */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <div className="card">
          <TitleRow icon={CalendarClock}>Próxima clase</TitleRow>
          <div className="muted" style={{ marginTop: 6 }}>
            Aquí mostraremos tu próxima clase (si luego conectamos el calendario / asistencias).
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/student/classes">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={18} />
                Ver calendario
              </span>
            </Link>
          </div>
        </div>

        <div className="card">
          <TitleRow icon={TrendingUp}>Progreso</TitleRow>
          <div className="muted" style={{ marginTop: 6 }}>
            Revisa tu evolución: constancia, objetivos, mejoras y seguimiento.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/student/progress">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={18} />
                Ver mi progreso
              </span>
            </Link>
          </div>
        </div>

        <div className="card">
          <TitleRow icon={CreditCard}>Pagos</TitleRow>
          <div className="muted" style={{ marginTop: 6 }}>
            Consulta tus pagos, estado y próximas cuotas.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/student/payments">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <CreditCard size={18} />
                Ver pagos
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tips / CTA */}
      <div className="card">
        <TitleRow icon={Flame}>Tips del día</TitleRow>

        <div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>
          • Llega 10 min antes para calentar bien.<br />
          • Técnica primero, potencia después.<br />
          • Constancia = progreso real.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <a className="btn btn-primary" href="/contacto" target="_blank" rel="noreferrer">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </span>
          </a>

          <Link className="btn" to="/tienda">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Store size={18} />
              Ver tienda
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
