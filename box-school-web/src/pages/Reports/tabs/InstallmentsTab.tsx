import React, { useEffect, useState } from "react";
import type { ReportFilters, StatCard, InstallmentRow } from "../types";
import { reportsApi } from "../reportsService";
import StatCards from "../components/StatCards";
import DataTable from "../components/DataTable";
import { moneyPENFromCents } from "../../Students/utils/money";

export default function InstallmentsTab(props: { filters: ReportFilters }) {
  const { filters } = props;
  const [cards, setCards] = useState<StatCard[]>([]);
  const [rows, setRows] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([reportsApi.installmentsSummary(filters), reportsApi.installmentsList(filters)])
      .then(([a, b]) => {
        if (!mounted) return;
        setCards(a?.cards ?? []);
        setRows(b?.rows ?? []);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(String(e?.response?.data?.message ?? e?.message ?? "No se pudo cargar Reporte Cuotas"));
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [filters.from, filters.to, filters.category_id, filters.method, filters.status, filters.q, filters.group_by]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <StatCards items={cards} />

      <DataTable
        loading={loading}
        err={err}
        rows={rows}
        columns={[
          { key: "due_on", title: "Vence" },
          { key: "status", title: "Estado" },
          { key: "student_name", title: "Alumno" },
          { key: "document_number", title: "DNI" },
          { key: "category_name", title: "Categoría" },
          { key: "method", title: "Método" },
          {
            key: "amount_cents",
            title: "Monto",
            render: (r) => moneyPENFromCents(Number(r.amount_cents ?? 0)),
          },
          {
            key: "paid_cents",
            title: "Pagado",
            render: (r) => moneyPENFromCents(Number(r.paid_cents ?? 0)),
          },
          { key: "days_late", title: "Atraso(días)" },
        ]}
      />
    </div>
  );
}
