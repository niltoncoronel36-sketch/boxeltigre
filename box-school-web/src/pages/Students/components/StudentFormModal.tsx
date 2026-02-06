import React, { useEffect } from "react";
import "./StudentFormModal.css";

import type { Student, StudentPayload } from "../../../services/students";

export type ModalMode = "create" | "edit";

export function StudentFormModal(props: {
  open: boolean;
  mode: ModalMode;
  editing: Student | null;
  form: StudentPayload;
  setForm: React.Dispatch<React.SetStateAction<StudentPayload>>;
  loading: boolean;
  err: string | null;

  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { open, mode, form, setForm, loading, err, onClose, onSubmit } = props;

  // ✅ ESC para cerrar + bloquear scroll
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="sfm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Nuevo estudiante" : "Editar estudiante"}
      onMouseDown={onClose}
    >
      <div className="sfm-card" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sfm-head">
          <div>
            <div className="sfm-title">{mode === "create" ? "Nuevo estudiante" : "Editar estudiante"}</div>
            <div className="sfm-sub">
              Completa los datos. Los campos con <b>*</b> son obligatorios.
            </div>
          </div>

          <button className="sfm-iconBtn" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="sfm-form">
          <div className="sfm-grid">
            <Field label="Nombres *">
              <input
                className="sfm-input"
                value={String((form as any).first_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), first_name: e.target.value }))}
                required
                autoFocus
              />
            </Field>

            <Field label="Apellidos *">
              <input
                className="sfm-input"
                value={String((form as any).last_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), last_name: e.target.value }))}
                required
              />
            </Field>

            <Field label="Fecha nacimiento">
              <input
                className="sfm-input"
                type="date"
                value={String((form as any).birthdate ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), birthdate: e.target.value }))}
              />
            </Field>

            <Field label="Teléfono">
              <input
                className="sfm-input"
                value={String((form as any).phone ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), phone: e.target.value }))}
                placeholder="999888777"
                inputMode="tel"
              />
            </Field>

            <Field label="Tipo Doc.">
              <select
                className="sfm-input"
                value={String((form as any).document_type ?? "DNI")}
                onChange={(e) => setForm((f) => ({ ...(f as any), document_type: e.target.value }))}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PAS">PAS</option>
              </select>
            </Field>

            <Field label="N° Doc.">
              <input
                className="sfm-input"
                value={String((form as any).document_number ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), document_number: e.target.value }))}
                placeholder="12345678"
                inputMode="numeric"
              />
            </Field>

            <Field label="Email">
              <input
                className="sfm-input"
                value={String((form as any).email ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), email: e.target.value }))}
                placeholder="correo@dominio.com"
                inputMode="email"
              />
            </Field>

            <Field label="Emergencia (Nombre)">
              <input
                className="sfm-input"
                value={String((form as any).emergency_contact_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), emergency_contact_name: e.target.value }))}
                placeholder="Contacto"
              />
            </Field>

            <Field label="Emergencia (Teléfono)">
              <input
                className="sfm-input"
                value={String((form as any).emergency_contact_phone ?? "")}
                onChange={(e) => setForm((f) => ({ ...(f as any), emergency_contact_phone: e.target.value }))}
                placeholder="999888777"
                inputMode="tel"
              />
            </Field>
          </div>

          <label className="sfm-check">
            <input
              type="checkbox"
              checked={Boolean((form as any).is_active)}
              onChange={(e) => setForm((f) => ({ ...(f as any), is_active: e.target.checked }))}
            />
            <span>Activo</span>
          </label>

          {err ? <div className="sfm-err">{err}</div> : null}

          {/* Footer actions */}
          <div className="sfm-actions">
            <button className="sfm-btn sfm-btn--ghost" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="sfm-btn sfm-btn--primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="sfm-spinner" aria-hidden="true" /> Guardando…
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sfm-field">
      <div className="sfm-label">{label}</div>
      {children}
    </div>
  );
}
