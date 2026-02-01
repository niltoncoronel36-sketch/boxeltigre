import React from "react";
import type { ReportFilters } from "../types";

export default function ReportFiltersBar(props: {
  value: ReportFilters;
  onChange: (next: ReportFilters) => void;
  categories?: Array<{ id: number; name: string }>;
  showMethod?: boolean;
  showStatus?: boolean;
  showGroupBy?: boolean;
}) {
  const { value, onChange, categories = [], showMethod, showStatus, showGroupBy } = props;

  function set(patch: Partial<ReportFilters>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="card" style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Desde</div>
        <input className="input" type="date" value={value.from} onChange={(e) => set({ from: e.target.value })} />
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Hasta</div>
        <input className="input" type="date" value={value.to} onChange={(e) => set({ to: e.target.value })} />
      </div>

      <div style={{ display: "grid", gap: 6, minWidth: 220 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Categoría</div>
        <select
          className="input"
          value={value.category_id === "" ? "" : String(value.category_id ?? "")}
          onChange={(e) => set({ category_id: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {showMethod ? (
        <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Método</div>
          <select className="input" value={value.method ?? ""} onChange={(e) => set({ method: e.target.value })}>
            <option value="">Todos</option>
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>
      ) : null}

      {showStatus ? (
        <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Estado</div>
          <select className="input" value={value.status ?? ""} onChange={(e) => set({ status: e.target.value })}>
            <option value="">Todos</option>
            <option value="paid">Pagado</option>
            <option value="unpaid">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="overdue">Vencido</option>
          </select>
        </div>
      ) : null}

      {showGroupBy ? (
        <div style={{ display: "grid", gap: 6, minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Agrupar</div>
          <select
            className="input"
            value={value.group_by ?? "day"}
            onChange={(e) => set({ group_by: e.target.value as any })}
          >
            <option value="day">Día</option>
            <option value="month">Mes</option>
            <option value="category">Categoría</option>
            <option value="method">Método</option>
          </select>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 6, flex: "1 1 260px" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(0,0,0,.65)" }}>Buscar (DNI / alumno / NV)</div>
        <input
          className="input"
          value={value.q ?? ""}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Ej: 74747474 / Camila / NV-000021"
        />
      </div>
    </div>
  );
}
