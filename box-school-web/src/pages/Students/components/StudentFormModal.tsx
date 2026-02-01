import React from "react";
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
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.35)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        zIndex: 70,
      }}
      onMouseDown={onClose}
    >
      <div className="card" style={{ width: "min(820px, 100%)" }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            {mode === "create" ? "Nuevo estudiante" : "Editar estudiante"}
          </div>
          <div style={{ marginLeft: "auto" }}>
            <button className="btn" type="button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Nombres</div>
              <input
                className="input"
                value={String(form.first_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Apellidos</div>
              <input
                className="input"
                value={String(form.last_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Fecha nacimiento</div>
              <input
                className="input"
                type="date"
                value={String(form.birthdate ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Teléfono</div>
              <input
                className="input"
                value={String(form.phone ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="999888777"
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Tipo Doc.</div>
              <input
                className="input"
                value={String(form.document_type ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, document_type: e.target.value }))}
                placeholder="DNI / CE / PAS"
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>N° Doc.</div>
              <input
                className="input"
                value={String(form.document_number ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, document_number: e.target.value }))}
                placeholder="12345678"
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Email</div>
              <input
                className="input"
                value={String(form.email ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="correo@dominio.com"
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Emergencia (Nombre)</div>
              <input
                className="input"
                value={String(form.emergency_contact_name ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))}
                placeholder="Contacto"
              />
            </div>

            <div className="grid">
              <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.70)" }}>Emergencia (Teléfono)</div>
              <input
                className="input"
                value={String(form.emergency_contact_phone ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))}
                placeholder="999888777"
              />
            </div>
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
            <input
              type="checkbox"
              checked={Boolean((form as any).is_active)}
              onChange={(e) => setForm((f) => ({ ...(f as any), is_active: e.target.checked }))}
            />
            <span style={{ color: "rgba(0,0,0,.75)", fontWeight: 900 }}>Activo</span>
          </label>

          {err ? <div className="err">{err}</div> : null}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
