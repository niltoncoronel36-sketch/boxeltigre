import React, { useEffect, useState } from "react";
import type { ReportFilters, StatCard, StoreRow } from "../types";
import { reportsApi } from "../reportsService";
import StatCards from "../components/StatCards";
import DataTable from "../components/DataTable";
import { moneyPENFromCents } from "../../Students/utils/money";

export default function StoreTab(props: { filters: ReportFilters }) {
  const { filters } = props;
  const [cards, setCards] = useState<StatCard[]>([]);
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    Promise.all([reportsApi.storeSummary(filters), reportsApi.storeList(filters)])
      .then(([a, b]) => {
        if (!mounted) return;
        setCards(a?.cards ?? []);
        setRows(b?.rows ?? []);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(String(e?.response?.data?.message ?? e?.message ?? "No se pudo cargar Reporte Tienda"));
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [filters.from, filters.to, filters.method, filters.status, filters.q, filters.group_by]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <StatCards items={cards} />
      <DataTable
        loading={loading}
        err={err}
        rows={rows}
        columns={[
          { key: "code", title: "Código" },
          { key: "created_at", title: "Fecha" },
          { key: "status", title: "Estado" },
          { key: "payment_method", title: "Método" },
          { key: "customer_name", title: "Cliente" },
          { key: "customer_phone", title: "Teléfono" },
          {
            key: "total_cents",
            title: "Total",
            render: (r) => moneyPENFromCents(Number(r.total_cents ?? 0)),
          },
        ]}
      />
    </div>
  );
}
