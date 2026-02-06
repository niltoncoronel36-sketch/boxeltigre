import React, { useMemo, useState } from "react";
import "./EnrollmentManager.css";

import type { Category } from "../../../services/categories";
import type { Enrollment, EnrollmentStatus } from "../../../services/enrollments";
import { createEnrollment, deleteEnrollment, updateEnrollment } from "../../../services/enrollments";
import { getApiErrorMessage } from "../../../services/api";
import { todayYmd, toYmd } from "../utils/dates";
import { categoryLabel, statusLabel } from "../utils/helpers";

export function EnrollmentManager(props: {
  studentId: number;
  categories: Category[];
  enrollments: Enrollment[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onRefresh: () => Promise<void>;
}) {
  const { studentId, categories, enrollments, loading, setLoading, setErr, onRefresh } = props;

  const [form, setForm] = useState<{
    category_id: number | "";
    starts_on: string;
    ends_on: string;
    status: EnrollmentStatus;
  }>({
    category_id: "",
    starts_on: todayYmd(),
    ends_on: "",
    status: "active",
  });

  const isFormValid = useMemo(() => form.category_id !== "", [form.category_id]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category_id) return;

    setErr(null);
    setLoading(true);

    try {
      const payload = {
        student_id: studentId,
        category_id: Number(form.category_id),
        starts_on: form.starts_on || todayYmd(),
        ends_on: form.ends_on || null,
        status: form.status,
      };

      await createEnrollment(payload);
      await onRefresh();
      setForm({ category_id: "", starts_on: todayYmd(), ends_on: "", status: "active" });
    } catch (err) {
      setErr(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function quickSetStatus(enr: Enrollment, status: EnrollmentStatus) {
    setErr(null);
    setLoading(true);
    try {
      const patch: any = { status };
      if (status === "ended" && !(enr as any).ends_on) patch.ends_on = todayYmd();
      await updateEnrollment(enr.id, patch);
      await onRefresh();
    } catch (err) {
      setErr(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(enr: Enrollment) {
    if (!window.confirm("¿Eliminar esta matrícula definitivamente?")) return;
    setErr(null);
    setLoading(true);
    try {
      await deleteEnrollment(enr.id);
      await onRefresh();
    } catch (err) {
      setErr(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="em-wrap">
      {/* Form */}
      <div className="em-card">
        <div className="em-head">
          <div>
            <div className="em-title">Nueva matrícula</div>
            <div className="em-sub">Registra una nueva matrícula para este estudiante.</div>
          </div>

          <div className="em-chip">
            ID Alumno: <span className="em-mono">{studentId}</span>
          </div>
        </div>

        <form onSubmit={onCreate} className="em-form">
          <div className="em-grid">
            <div className="em-field">
              <div className="em-label">Categoría *</div>
              <select
                className="em-input"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : "" })}
                disabled={loading}
              >
                <option value="">-- Selecciona --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabel(c as any)}
                  </option>
                ))}
              </select>
            </div>

            <div className="em-field">
              <div className="em-label">Fecha inicio</div>
              <input
                type="date"
                className="em-input"
                value={form.starts_on}
                onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="em-field">
              <div className="em-label">Estado inicial</div>
              <select
                className="em-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EnrollmentStatus })}
                disabled={loading}
              >
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="ended">Finalizada</option>
              </select>
            </div>

            <div className="em-field">
              <div className="em-label">Fecha fin (opcional)</div>
              <input
                type="date"
                className="em-input"
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="em-actions">
            <button
              type="submit"
              className="em-btn em-btn--primary"
              disabled={loading || !isFormValid}
              title={!isFormValid ? "Selecciona una categoría" : "Registrar matrícula"}
            >
              {loading ? (
                <>
                  <span className="em-spinner" aria-hidden="true" /> Guardando…
                </>
              ) : (
                "Registrar matrícula"
              )}
            </button>
          </div>

          <div className="em-hint">
            * Si marcas <b>Finalizada</b> y no hay fecha fin, el sistema puede colocar la fecha de hoy al cerrar.
          </div>
        </form>
      </div>

      {/* List */}
      <div className="em-card em-card--table">
        <div className="em-tableHead">
          <div className="em-title2">Historial de matrículas</div>
          <div className="em-meta">
            Total: <b>{enrollments.length}</b>
          </div>
        </div>

        <div className="em-tableWrap" role="region" aria-label="Tabla de matrículas">
          <table className="em-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Período</th>
                <th>Estado</th>
                <th className="em-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="em-empty">
                    No hay matrículas registradas.
                  </td>
                </tr>
              ) : (
                enrollments.map((enr) => {
                  const st = (enr.status ?? "active") as EnrollmentStatus;
                  return (
                    <tr key={enr.id}>
                      <td>
                        <div className="em-strong">
                          {enr.category ? categoryLabel(enr.category as any) : "N/A"}
                        </div>
                        <div className="em-muted">
                          ID: <span className="em-mono">{enr.id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="em-strong">
                          {toYmd((enr as any).starts_on)}
                          <span className="em-dash"> — </span>
                          {(enr as any).ends_on ? toYmd((enr as any).ends_on) : "Presente"}
                        </div>
                        <div className="em-muted">
                          Inicio: {(enr as any).starts_on ?? "—"} • Fin: {(enr as any).ends_on ?? "—"}
                        </div>
                      </td>

                      <td>
                        <span className={`em-badge em-badge--${st}`}>
                          {statusLabel(st as any)}
                        </span>
                      </td>

                      <td className="em-right">
                        <div className="em-rowActions">
                          <button
                            type="button"
                            className="em-link"
                            onClick={() => quickSetStatus(enr, st === "active" ? "paused" : "active")}
                            disabled={loading}
                            title={st === "active" ? "Pausar matrícula" : "Reactivar matrícula"}
                          >
                            {st === "active" ? "Pausar" : "Reactivar"}
                          </button>

                          <button
                            type="button"
                            className="em-link em-link--danger"
                            onClick={() => onDelete(enr)}
                            disabled={loading}
                            title="Eliminar matrícula"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="em-footNote">
          Consejo: evita eliminar matrículas antiguas; mejor usa <b>Finalizada</b> para mantener historial.
        </div>
      </div>
    </div>
  );
}
