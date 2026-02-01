import React from "react";
import type { Student } from "../../../services/students";
import { calcAge } from "../utils/dates";
import { formatName } from "../utils/helpers";

export function StudentsTable(props: {
  items: Student[];
  total: number;
  page: number;
  lastPage: number;
  loading: boolean;
  err: string | null;

  search: string;
  active: "1" | "0" | "";

  onSearchChange: (v: string) => void;
  onActiveChange: (v: "1" | "0" | "") => void;

  onOpenCreate: () => void;
  onRowClick: (s: Student) => void;

  onPrev: () => void;
  onNext: () => void;

  // ✅ NUEVO
  onCreateUser: (s: Student) => void;
  creatingUserStudentId?: number | null;
}) {
  const {
    items,
    total,
    page,
    lastPage,
    loading,
    err,
    search,
    active,
    onSearchChange,
    onActiveChange,
    onOpenCreate,
    onRowClick,
    onPrev,
    onNext,
    onCreateUser,
    creatingUserStudentId,
  } = props;

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Estudiantes</div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ width: 280 }}
            placeholder="Buscar: nombre, doc, email, phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <select
            className="input"
            style={{ width: 160 }}
            value={active}
            onChange={(e) => onActiveChange(e.target.value as any)}
          >
            <option value="1">Activos</option>
            <option value="">Todos</option>
            <option value="0">Inactivos</option>
          </select>

          <button className="btn btn-primary" onClick={onOpenCreate} disabled={loading}>
            Nuevo
          </button>
        </div>
      </div>

      {err ? <div className="err" style={{ marginTop: 12 }}>{err}</div> : null}

      <div style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Nombre", "Edad", "Documento", "Contacto", "Estado", "Usuario"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 10px",
                    borderBottom: "1px solid rgba(0,0,0,.08)",
                    color: "rgba(0,0,0,.70)",
                    fontWeight: 800,
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 14, color: "rgba(0,0,0,.65)" }}>
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 14, color: "rgba(0,0,0,.65)" }}>
                  No hay estudiantes.
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const hasUser = Boolean((s as any).user_id);
                const dni = (s as any).document_number ?? "";

                return (
                  <tr key={s.id} onClick={() => onRowClick(s)} style={{ cursor: "pointer" }}>
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <div style={{ fontWeight: 900 }}>{formatName(s)}</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                        ID: {s.id} {s.email ? `• ${s.email}` : ""}
                      </div>
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <div style={{ fontWeight: 900 }}>{calcAge(s.birthdate)}</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                        {s.birthdate ?? "—"}
                      </div>
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <div style={{ fontWeight: 800 }}>
                        {s.document_type && s.document_number ? `${s.document_type} ${s.document_number}` : "—"}
                      </div>
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <div style={{ fontWeight: 800 }}>{s.phone ?? "—"}</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                        Emerg: {s.emergency_contact_phone ?? "—"}
                      </div>
                    </td>

                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: "1px solid rgba(0,0,0,.10)",
                          background: s.is_active ? "rgba(255,122,24,.12)" : "rgba(255,45,45,.10)",
                          color: "rgba(0,0,0,.80)",
                          fontSize: 12,
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* ✅ NUEVO: USUARIO */}
                    <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                      {hasUser ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,.10)",
                            background: "rgba(0,200,0,.10)",
                            color: "rgba(0,0,0,.80)",
                            fontSize: 12,
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                          }}
                          title="Usuario creado"
                        >
                          {dni || "Creado"}
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateUser(s);
                          }}
                          disabled={creatingUserStudentId === s.id || !dni}
                          style={{
                            padding: "8px 10px",
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                          title={!dni ? "Este alumno no tiene DNI para crear usuario" : "Crea usuario y contraseña = DNI"}
                        >
                          {creatingUserStudentId === s.id ? "Creando..." : "Crear usuario"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,.55)" }}>
          Tip: haz click en un alumno para ver detalle.
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ color: "rgba(0,0,0,.60)", fontSize: 12 }}>
          Total: <b style={{ color: "rgba(0,0,0,.88)" }}>{total}</b>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn" onClick={onPrev} disabled={loading || page <= 1}>
            ←
          </button>
          <div style={{ color: "rgba(0,0,0,.70)", fontSize: 12, fontWeight: 900 }}>
            {page} / {lastPage}
          </div>
          <button className="btn" onClick={onNext} disabled={loading || page >= lastPage}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}
