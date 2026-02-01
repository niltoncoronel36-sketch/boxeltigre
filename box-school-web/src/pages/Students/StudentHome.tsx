import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  User,
  IdCard,
  CalendarDays,
  Phone,
  Mail,
  ShieldCheck,
  BadgeCheck,
  HeartPulse,
  GraduationCap,
  Clock,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useStudentCurrent } from "./hooks/useStudentCurrent";

function fmtDate(d?: string | null) {
  if (!d) return "—";
  // YYYY-MM-DD
  if (String(d).includes("-") && String(d).length >= 10) {
    const [y, m, day] = String(d).slice(0, 10).split("-");
    return `${day}/${m}/${y}`;
  }
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString();
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function calcAge(birthdate?: string | null) {
  if (!birthdate) return "—";
  const d = new Date(`${birthdate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${age} años`;
}

function badgeStyle(tone: "ok" | "warn" | "neutral") {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(0,0,0,.10)",
    whiteSpace: "nowrap",
  };
  if (tone === "ok") return { ...base, background: "rgba(0,200,0,.10)", color: "rgba(0,0,0,.85)" };
  if (tone === "warn") return { ...base, background: "rgba(255,200,0,.18)", color: "rgba(0,0,0,.85)" };
  return { ...base, background: "rgba(0,0,0,.05)", color: "rgba(0,0,0,.75)" };
}

function row(icon: JSX.Element, label: string, value: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "22px 140px 1fr", gap: 10, padding: "10px 0" }}>
      <div style={{ opacity: 0.8 }}>{icon}</div>
      <div style={{ color: "rgba(0,0,0,.60)", fontWeight: 900, fontSize: 13 }}>{label}</div>
      <div style={{ color: "rgba(0,0,0,.86)", fontWeight: 900, fontSize: 13, textAlign: "right" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function StudentHome() {
  const { user, roles } = useAuth();
  const { student, loading, error } = useStudentCurrent();

  const roleText = useMemo(() => {
    const keys = (roles ?? []).map((r: any) => r?.key).filter(Boolean);
    return keys.length ? keys.join(", ") : "—";
  }, [roles]);

  if (loading) return <div className="card">Cargando perfil…</div>;
  if (error) return <div className="card" style={{ color: "crimson" }}>{error}</div>;
  if (!student) return <div className="card">No se encontró información del alumno.</div>;

  const fullName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || (user as any)?.name || "Alumno";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  const enrollment = student.activeEnrollment;
  const category = enrollment?.category;

  const isActive = Boolean(student.is_active);
  const statusBadge = isActive ? { text: "Activo", tone: "ok" as const } : { text: "Inactivo", tone: "warn" as const };

  return (
    <div style={{ maxWidth: 1050, margin: "0 auto" }}>
      {/* Header / Perfil */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              fontWeight: 950,
              background: "radial-gradient(circle at 30% 30%, rgba(255,106,0,0.35), rgba(0,0,0,0.06))",
              border: "1px solid rgba(255,106,0,0.25)",
              color: "rgba(0,0,0,.85)",
            }}
            title="Perfil"
          >
            {initials || "A"}
          </div>

          <div style={{ minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 20, fontWeight: 950, letterSpacing: 0.2 }}>{fullName}</div>
              <span style={badgeStyle(statusBadge.tone)}>
                <BadgeCheck size={14} />
                {statusBadge.text}
              </span>
            </div>

            <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", color: "rgba(0,0,0,.60)", fontSize: 13, fontWeight: 800 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IdCard size={14} />
                {student.document_type ?? "DOC"} {student.document_number ?? "—"}
              </span>

              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <CalendarDays size={14} />
                {fmtDate(student.birthdate)} • {calcAge(student.birthdate)}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <NavLink to="/student/classes" className="btn">
              <GraduationCap size={16} />
              Mis clases
            </NavLink>
            <NavLink to="/student/progress" className="btn">
              <Clock size={16} />
              Progreso
            </NavLink>
            <NavLink to="/student/payments" className="btn btn-primary">
              <ShieldCheck size={16} />
              Pagos
            </NavLink>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 12,
        }}
      >
        {/* Datos personales */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={16} />
            Datos personales
          </div>
          <div style={{ marginTop: 8 }}>
            {row(<IdCard size={16} />, "ID Alumno", student.id)}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<CalendarDays size={16} />, "Nacimiento", fmtDate(student.birthdate))}
            {row(<CalendarDays size={16} />, "Edad", calcAge(student.birthdate))}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<BadgeCheck size={16} />, "Estado", statusBadge.text)}
          </div>
        </div>

        {/* Contacto */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={16} />
            Contacto
          </div>
          <div style={{ marginTop: 8 }}>
            {row(<Phone size={16} />, "Teléfono", student.phone ?? "—")}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<Mail size={16} />, "Email alumno", student.email ?? "—")}
          </div>
        </div>

        {/* Emergencia */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 8 }}>
            <HeartPulse size={16} />
            Contacto de emergencia
          </div>
          <div style={{ marginTop: 8 }}>
            {row(<User size={16} />, "Nombre", student.emergency_contact_name ?? "—")}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<Phone size={16} />, "Teléfono", student.emergency_contact_phone ?? "—")}
          </div>
        </div>

        {/* Matrícula / categoría */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 8 }}>
            <GraduationCap size={16} />
            Matrícula
          </div>

          <div style={{ marginTop: 8 }}>
            {enrollment ? (
              <>
                {row(<GraduationCap size={16} />, "Categoría", category?.name ?? "—")}
                {row(<BadgeCheck size={16} />, "Nivel", category?.level ?? "—")}
                <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
                {row(<ShieldCheck size={16} />, "Estado", enrollment.status ?? "—")}
                {row(<CalendarDays size={16} />, "Vigencia", `${enrollment.starts_on ?? "—"} → ${enrollment.ends_on ?? "—"}`)}
              </>
            ) : (
              <div style={{ color: "rgba(0,0,0,.70)", fontSize: 14 }}>
                No tienes una matrícula activa.
              </div>
            )}
          </div>
        </div>

        {/* Cuenta (users) */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 950, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={16} />
            Cuenta (acceso)
          </div>

          <div style={{ marginTop: 8 }}>
            {row(<IdCard size={16} />, "User ID", student.user_id ?? (user as any)?.id ?? "—")}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<Mail size={16} />, "Usuario", (user as any)?.email ?? "—")}
            {row(<IdCard size={16} />, "DNI (users)", (user as any)?.dni ?? "—")}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<ShieldCheck size={16} />, "Roles", roleText)}
            <div style={{ height: 1, background: "rgba(0,0,0,.08)" }} />
            {row(<Clock size={16} />, "Creado", fmtDateTime(student.created_at))}
            {row(<Clock size={16} />, "Actualizado", fmtDateTime(student.updated_at))}
          </div>
        </div>
      </div>
    </div>
  );
}
