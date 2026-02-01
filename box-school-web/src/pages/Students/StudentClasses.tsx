import { CalendarDays, BadgeCheck, Layers3, Timer, Activity } from "lucide-react";
import { useStudentCurrent } from "./hooks/useStudentCurrent";

function row(label: string, value: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0" }}>
      <div style={{ color: "rgba(0,0,0,.60)", fontWeight: 800, fontSize: 13 }}>{label}</div>
      <div style={{ color: "rgba(0,0,0,.85)", fontWeight: 900, fontSize: 13, textAlign: "right" }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

export default function StudentClasses() {
  const { student, loading, error } = useStudentCurrent();

  if (loading) return <div className="card">Cargando clases…</div>;
  if (error) return <div className="card" style={{ color: "crimson" }}>{error}</div>;
  if (!student) return <div className="card">No se encontró información del alumno.</div>;

  const enrollment = student.activeEnrollment;
  const category = enrollment?.category;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <CalendarDays size={22} />
        <h2 style={{ fontWeight: 900, margin: 0 }}>Mis clases</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12, marginTop: 14 }}>
        {/* Card principal */}
        <div className="card" style={{ maxWidth: 700 }}>
          <div style={{ fontWeight: 950, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <BadgeCheck size={16} />
            Información de tu plan
          </div>

          {enrollment ? (
            <>
              {row("Alumno", `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "—")}
              {row("DNI", student.document_number ?? "—")}
              <div style={{ height: 1, background: "rgba(0,0,0,.08)", margin: "6px 0" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, color: "rgba(0,0,0,.75)", fontWeight: 900 }}>
                <Layers3 size={16} />
                Categoría activa
              </div>

              {row("Categoría", category?.name ?? "—")}
              {row("Nivel", category?.level ?? "—")}
              {row("Estado", enrollment.status ?? "—")}
              {row("Vigencia", `${enrollment.starts_on ?? "—"} → ${enrollment.ends_on ?? "—"}`)}
            </>
          ) : (
            <div style={{ color: "rgba(0,0,0,.70)", fontSize: 14 }}>
              No tienes una matrícula activa por ahora.
            </div>
          )}
        </div>

        {/* Card “Próximamente” */}
        <div className="card">
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Próximamente</div>

          <div
            style={{
              display: "grid",
              gap: 10,
              fontSize: 14,
              color: "rgba(0,0,0,.75)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Timer size={18} />
              <div>
                <div style={{ fontWeight: 900 }}>Horarios</div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                  Días y horas de entrenamiento.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Activity size={18} />
              <div>
                <div style={{ fontWeight: 900 }}>Asistencias</div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                  Registro y resumen de asistencia.
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                background: "rgba(0,0,0,.04)",
                fontSize: 13,
                color: "rgba(0,0,0,.70)",
              }}
            >
              Cuando agreguemos horarios, aquí saldrá tu calendario semanal y próximas sesiones.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
