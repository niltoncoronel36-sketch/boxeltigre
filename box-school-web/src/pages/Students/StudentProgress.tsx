import { useMemo } from "react";
import {
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Percent,
} from "lucide-react";
import { useStudentAttendance } from "./hooks/useStudentAttendance";

function fmtDate(d: string) {
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString();
}

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const dt = new Date(String(t));
  if (Number.isNaN(dt.getTime())) return String(t);
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function badgeStyle(kind: "ok" | "warn" | "danger") {
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

  if (kind === "ok") return { ...base, background: "rgba(0,200,0,.10)", color: "rgba(0,0,0,.82)" };
  if (kind === "warn") return { ...base, background: "rgba(255,200,0,.18)", color: "rgba(0,0,0,.86)" };
  return { ...base, background: "rgba(255,0,0,.12)", color: "rgba(0,0,0,.86)" };
}

export default function StudentProgress() {
  const { items, loading, error } = useStudentAttendance();

  const summary = useMemo(() => {
    const total = items.length;
    const present = items.filter((i) => i.status === "present").length;
    const late = items.filter((i) => i.status === "late").length;
    const absent = items.filter((i) => i.status === "absent").length;
    const percent = total ? Math.round((present / total) * 100) : 0;
    return { total, present, late, absent, percent };
  }, [items]);

  if (loading) return <div className="card">Cargando asistencias…</div>;

  if (error) {
    return (
      <div className="card" style={{ color: "crimson" }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <TrendingUp size={22} />
        <h2 style={{ fontWeight: 900, margin: 0 }}>Mi progreso</h2>
      </div>

      {/* ===== RESUMEN ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 14,
          marginBottom: 14,
        }}
      >
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>TOTAL</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{summary.total}</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>PRESENTE</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{summary.present}</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock3 size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>TARDE</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{summary.late}</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <XCircle size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>FALTA</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{summary.absent}</div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Percent size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>ASISTENCIA</div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{summary.percent}%</div>

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(0,0,0,.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, summary.percent))}%`,
                  background: "rgba(255,106,0,.75)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== TABLA ===== */}
      <div className="card" style={{ maxWidth: 760, overflowX: "auto" }}>
        {items.length === 0 ? (
          <div>No hay asistencias registradas.</div>
        ) : (
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Fecha", "Estado", "Hora"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid rgba(0,0,0,.08)",
                      color: "rgba(0,0,0,.70)",
                      fontWeight: 900,
                      fontSize: 12,
                      letterSpacing: 0.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {items.map((a, i) => {
                const kind = a.status === "present" ? "ok" : a.status === "late" ? "warn" : "danger";
                const Icon = a.status === "present" ? CheckCircle2 : a.status === "late" ? Clock3 : XCircle;

                return (
                  <tr key={i}>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {fmtDate(a.date)}
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <span style={badgeStyle(kind)}>
                        <Icon size={14} />
                        {a.status === "present" && "Presente"}
                        {a.status === "late" && "Tarde"}
                        {a.status === "absent" && "Falta"}
                      </span>
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {fmtTime(a.checked_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
