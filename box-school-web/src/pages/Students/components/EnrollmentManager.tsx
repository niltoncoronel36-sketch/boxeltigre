import React, { useState } from "react";
import type { Category } from "../../../services/categories";
import type { Enrollment, EnrollmentStatus } from "../../../services/enrollments";
import { createEnrollment, deleteEnrollment, updateEnrollment } from "../../../services/enrollments";
import { getApiErrorMessage } from "../../../services/api";
import { todayYmd, toYmd, ymdGte } from "../utils/dates";
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

  // --- LÓGICA DE NEGOCIO ---
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
    setLoading(true);
    try {
      const patch: any = { status };
      if (status === "ended" && !enr.ends_on) patch.ends_on = todayYmd();
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

  // --- ESTILOS PROFESIONALES (Constantes para limpieza) ---
  const containerStyle: React.CSSProperties = {
    background: "#ffffff",
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid #eef2f6",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)",
    maxWidth: "650px",
    boxSizing: "border-box",
    margin: "0 auto"
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "45px",
    borderRadius: "10px",
    border: "1px solid #dce4ec",
    padding: "0 15px",
    fontSize: "14px",
    color: "#2c3e50",
    background: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 700,
    color: "#64748b",
    marginBottom: "8px",
    display: "block",
    letterSpacing: "0.3px"
  };

  const isFormValid = form.category_id !== "";

  return (
    <div style={{ marginTop: 25 }}>
      
      {/* 🟠 FORMULARIO DE ALTA */}
      <div style={containerStyle}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "25px", color: "#1e293b", textTransform: "uppercase", letterSpacing: "1px" }}>
          Nueva Matrícula
        </h3>

        <form onSubmit={onCreate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
            
            <div>
              <label style={labelStyle}>Categoría</label>
              <select
                style={inputStyle}
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : "" })}
              >
                <option value="">-- Selecciona --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{categoryLabel(c as any)}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Fecha Inicio</label>
              <input
                type="date"
                style={inputStyle}
                value={form.starts_on}
                onChange={(e) => setForm({ ...form, starts_on: e.target.value })}
              />
            </div>

            <div>
              <label style={labelStyle}>Estado Inicial</label>
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EnrollmentStatus })}
              >
                <option value="active">Activa</option>
                <option value="paused">Pausada</option>
                <option value="ended">Finalizada</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Fecha Fin (Opcional)</label>
              <input
                type="date"
                style={inputStyle}
                value={form.ends_on}
                onChange={(e) => setForm({ ...form, ends_on: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !isFormValid}
            style={{ 
              width: "100%",
              height: "50px",
              borderRadius: "12px",
              border: "none",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 800,
              cursor: (loading || !isFormValid) ? "not-allowed" : "pointer",
              background: isFormValid ? "linear-gradient(135deg, #ff6b3d 0%, #ff3b3b 100%)" : "#cbd5e1",
              boxShadow: isFormValid ? "0 6px 20px rgba(255, 59, 59, 0.25)" : "none",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "Guardando..." : "Registrar Matrícula"}
          </button>
        </form>
      </div>

      {/* 🔵 TABLA DE RESULTADOS */}
      <div style={{ marginTop: 35, background: "#fff", borderRadius: "16px", border: "1px solid #eef2f6", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #eef2f6" }}>
              <th style={{ padding: "15px 20px", textAlign: "left", fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>CATEGORÍA</th>
              <th style={{ padding: "15px 20px", textAlign: "left", fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>PERÍODO</th>
              <th style={{ padding: "15px 20px", textAlign: "left", fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>ESTADO</th>
              <th style={{ padding: "15px 20px", textAlign: "right", fontSize: "11px", color: "#94a3b8", fontWeight: 800 }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#cbd5e1", fontSize: "14px" }}>
                  No hay matrículas registradas.
                </td>
              </tr>
            ) : (
              enrollments.map((enr) => (
                <tr key={enr.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "15px 20px", fontWeight: 700, color: "#334155" }}>
                    {enr.category ? categoryLabel(enr.category as any) : "N/A"}
                  </td>
                  <td style={{ padding: "15px 20px", fontSize: "13px", color: "#64748b" }}>
                    {toYmd(enr.starts_on)} <span style={{ color: "#cbd5e1" }}>—</span> {enr.ends_on ? toYmd(enr.ends_on) : "Presente"}
                  </td>
                  <td style={{ padding: "15px 20px" }}>
                    <span style={{ 
                      padding: "5px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 800,
                      background: enr.status === 'active' ? '#f0fdf4' : '#fff7ed',
                      color: enr.status === 'active' ? '#16a34a' : '#ea580c',
                      textTransform: "uppercase"
                    }}>
                      {statusLabel(enr.status as any)}
                    </span>
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => quickSetStatus(enr, enr.status === 'active' ? 'paused' : 'active')}
                        style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                      >
                        {enr.status === 'active' ? 'Pausar' : 'Reactivar'}
                      </button>
                      <button 
                        onClick={() => onDelete(enr)}
                        style={{ background: "none", border: "none", color: "#f43f5e", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}