import React, { useEffect, useState } from "react";
import type { ReportFilters, StatCard, AttendanceRow } from "../types";
import { reportsApi } from "../reportsService";
import StatCards from "../components/StatCards";
import DataTable from "../components/DataTable";

export default function AttendanceTab(props: { filters: ReportFilters }) {
  const { filters } = props;
  const [cards, setCards] = useState<StatCard[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([reportsApi.attendanceSummary(filters), reportsApi.attendanceList(filters)])
      .then(([a, b]) => {
        if (!mounted) return;
        setCards(a?.cards ?? []);
        setRows(b?.rows ?? []);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(String(e?.response?.data?.message ?? e?.message ?? "No se pudo cargar Reporte Asistencia"));
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [filters.from, filters.to, filters.category_id, filters.q]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <StatCards items={cards} />
      <DataTable
        loading={loading}
        err={err}
        rows={rows}
        columns={[
          { key: "date", title: "Fecha" },
          { key: "student_name", title: "Alumno" },
          { key: "document_number", title: "DNI" },
          { key: "category_name", title: "Categoría" },
          { key: "check_in_time", title: "Entrada" },
          { key: "check_out_time", title: "Salida" },
        ]}
      />
    </div>
  );
}
