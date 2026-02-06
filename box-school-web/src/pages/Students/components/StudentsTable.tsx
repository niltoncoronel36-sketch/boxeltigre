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

  onOpenCreate: () => void; // (lo dejamos por compatibilidad, pero ya no se usa aquí)
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
    onRowClick,
    onPrev,
    onNext,
    onCreateUser,
    creatingUserStudentId,
  } = props;

  const resultsLabel = loading
    ? "Cargando…"
    : `${items.length} de ${total} resultado${total === 1 ? "" : "s"}`;

  return (
    <div className="st-cardPro">
      {/* Top bar */}
      <div className="st-top">
        <div className="st-top__left">
          <div className="st-title">Listado de alumnos</div>
          <div className="st-sub">
            <span className="st-pill">{resultsLabel}</span>
            <span className="st-hint">Tip: click en un alumno para ver el perfil</span>
          </div>
        </div>

        <div className="st-top__right">
          <span className={`st-dot ${loading ? "is-on" : ""}`} title={loading ? "Actualizando" : "Listo"} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="st-toolbarPro">
        <div className="st-searchPro">
          <span className="st-searchIcon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="st-inputPro"
            placeholder="Buscar por nombre, DNI, correo o teléfono…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search ? (
            <button className="st-clear" type="button" onClick={() => onSearchChange("")} title="Limpiar">
              ✕
            </button>
          ) : null}
        </div>

        <div className="st-filtersPro">
          <select
            className="st-selectPro"
            value={active}
            onChange={(e) => onActiveChange(e.target.value as any)}
            title="Filtrar por estado"
          >
            <option value="1">Activos</option>
            <option value="">Todos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>
      </div>

      {err ? <div className="st-errPro">{err}</div> : null}

      {/* Table */}
      <div className="st-tableWrapPro" role="region" aria-label="Tabla de estudiantes">
        <table className="st-tablePro">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Edad</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th className="st-thRight">Usuario</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="st-emptyPro">
                  <span className="st-skelLine" />
                  <span className="st-skelLine st-skelLine--sm" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="st-emptyPro">
                  No hay alumnos para mostrar.
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const hasUser = Boolean((s as any).user_id);
                const dni = String((s as any).document_number ?? "").trim();

                return (
                  <tr
                    key={s.id}
                    className="st-rowPro"
                    onClick={() => onRowClick(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onRowClick(s);
                    }}
                  >
                    <td>
                      <div className="st-userCell">
                        <div className="st-avatar" aria-hidden="true">
                          {String(s.first_name?.[0] ?? "A").toUpperCase()}
                          {String(s.last_name?.[0] ?? "L").toUpperCase()}
                        </div>

                        <div className="st-userMeta">
                          <div className="st-name">{formatName(s)}</div>
                          <div className="st-muted">
                            ID: <span className="st-mono">{s.id}</span>
                            {s.email ? <span> • {s.email}</span> : null}
                          </div>
                        </div>
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
                      <span className={`st-badgePro ${s.is_active ? "is-active" : "is-inactive"}`}>
                        {s.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="st-tdRight" onClick={(e) => e.stopPropagation()}>
                      {hasUser ? (
                        <span className="st-userBadge" title="Usuario creado">
                          <span className="st-userBadge__dot" />
                          {dni || "Creado"}
                        </span>
                      ) : (
                        <button
                          className="st-actionBtn"
                          type="button"
                          onClick={() => onCreateUser(s)}
                          disabled={creatingUserStudentId === s.id || !dni}
                          title={!dni ? "Este alumno no tiene DNI para crear usuario" : "Usuario y contraseña = DNI"}
                        >
                          {creatingUserStudentId === s.id ? (
                            <>
                              <span className="st-spinner" aria-hidden="true" />
                              Creando…
                            </>
                          ) : (
                            "Crear usuario"
                          )}
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
      <div className="st-footPro">
        <div className="st-footPro__left">
          Página <b>{page}</b> de <b>{lastPage}</b>
        </div>

        <div className="st-footPro__right">
          <button className="st-pgBtnPro" onClick={onPrev} disabled={loading || page <= 1} type="button">
            ← Anterior
          </button>
          <button className="st-pgBtnPro" onClick={onNext} disabled={loading || page >= lastPage} type="button">
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
