import React from "react";
import "./StudentsTable.css";

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
    <div className="card st-card">
      {/* Header */}
      <div className="st-head">
        <div className="st-head__left">
          <div className="st-title">Estudiantes</div>
          <div className="st-sub">
            Total: <b>{total}</b> • Tip: click en un alumno para ver detalle
          </div>
        </div>

        <button className="btn btn-primary st-new" onClick={onOpenCreate} disabled={loading} type="button">
          + Nuevo
        </button>
      </div>

      {/* Toolbar */}
      <div className="st-toolbar">
        <div className="st-search">
          <input
            className="input st-input"
            placeholder="Buscar: nombre, doc, email, phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select className="input st-input st-select" value={active} onChange={(e) => onActiveChange(e.target.value as any)}>
          <option value="1">Activos</option>
          <option value="">Todos</option>
          <option value="0">Inactivos</option>
        </select>
      </div>

      {err ? (
        <div className="err st-err">
          {err}
        </div>
      ) : null}

      {/* Table */}
      <div className="st-tableWrap" role="region" aria-label="Tabla de estudiantes">
        <table className="st-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Edad</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Usuario</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="st-empty">
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="st-empty">
                  No hay estudiantes.
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const hasUser = Boolean((s as any).user_id);
                const dni = String((s as any).document_number ?? "").trim();

                return (
                  <tr key={s.id} className="st-row" onClick={() => onRowClick(s)} role="button" tabIndex={0}>
                    <td>
                      <div className="st-name">{formatName(s)}</div>
                      <div className="st-muted">
                        ID: <span className="mono">{s.id}</span>
                        {s.email ? <span> • {s.email}</span> : null}
                      </div>
                    </td>

                    <td>
                      <div className="st-strong">{calcAge(s.birthdate)}</div>
                      <div className="st-muted">{s.birthdate ?? "—"}</div>
                    </td>

                    <td>
                      <div className="st-strong">
                        {s.document_type && (s as any).document_number
                          ? `${s.document_type} ${(s as any).document_number}`
                          : "—"}
                      </div>
                    </td>

                    <td>
                      <div className="st-strong">{(s as any).phone ?? "—"}</div>
                      <div className="st-muted">Emerg: {(s as any).emergency_contact_phone ?? "—"}</div>
                    </td>

                    <td>
                      <span className={`st-badge ${s.is_active ? "is-active" : "is-inactive"}`}>
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      {hasUser ? (
                        <span className="st-badge is-user" title="Usuario creado">
                          {dni || "Creado"}
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary st-btnTiny"
                          type="button"
                          onClick={() => onCreateUser(s)}
                          disabled={creatingUserStudentId === s.id || !dni}
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
      </div>

      {/* Footer / Pagination */}
      <div className="st-foot">
        <div className="st-foot__left">
          Página <b>{page}</b> de <b>{lastPage}</b>
        </div>

        <div className="st-foot__right">
          <button className="btn st-pgBtn" onClick={onPrev} disabled={loading || page <= 1} type="button">
            ← Anterior
          </button>
          <button className="btn st-pgBtn" onClick={onNext} disabled={loading || page >= lastPage} type="button">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
