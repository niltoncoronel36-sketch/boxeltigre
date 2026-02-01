import React, { useEffect, useMemo, useState } from "react";
import ReportFiltersBar from "./components/ReportFilters";
import FinanceTab from "./tabs/FinanceTab";
import InstallmentsTab from "./tabs/InstallmentsTab";
import StudentsTab from "./tabs/StudentsTab";
import AttendanceTab from "./tabs/AttendanceTab";
import StoreTab from "./tabs/StoreTab";
import type { ReportFilters } from "./types";

function todayYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function firstDayOfMonthYmd() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

type TabKey = "finance" | "installments" | "students" | "attendance" | "store";

export default function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("finance");

  const [filters, setFilters] = useState<ReportFilters>({
    from: firstDayOfMonthYmd(),
    to: todayYmd(),
    category_id: "",
    method: "",
    status: "",
    q: "",
    group_by: "day",
  });

  // ✅ categorías (por ahora simple)
  // luego lo conectamos a /categories o listActiveCategories()
  const categories = useMemo(() => [], []);

  const tabCfg = useMemo(() => {
    if (tab === "finance") return { method: true, status: true, group_by: true };
    if (tab === "installments") return { method: true, status: true, group_by: false };
    if (tab === "students") return { method: false, status: true, group_by: false };
    if (tab === "attendance") return { method: false, status: false, group_by: false };
    if (tab === "store") return { method: true, status: true, group_by: true };
    return { method: false, status: false, group_by: false };
  }, [tab]);

  useEffect(() => {
    // limpia status/metodo si no aplican para que no “ensucie” queries
    setFilters((f) => ({
      ...f,
      method: tabCfg.method ? f.method : "",
      status: tabCfg.status ? f.status : "",
      group_by: tabCfg.group_by ? f.group_by : "day",
    }));
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card" style={{ padding: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["finance", "Finanzas"],
          ["installments", "Cuotas"],
          ["students", "Alumnos"],
          ["attendance", "Asistencia"],
          ["store", "Tienda"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`btn ${tab === (k as any) ? "btn-primary" : ""}`}
            type="button"
            onClick={() => setTab(k as TabKey)}
          >
            {label}
          </button>
        ))}
      </div>

      <ReportFiltersBar
        value={filters}
        onChange={setFilters}
        categories={categories}
        showMethod={tabCfg.method}
        showStatus={tabCfg.status}
        showGroupBy={tabCfg.group_by}
      />

      {tab === "finance" ? <FinanceTab filters={filters} /> : null}
      {tab === "installments" ? <InstallmentsTab filters={filters} /> : null}
      {tab === "students" ? <StudentsTab filters={filters} /> : null}
      {tab === "attendance" ? <AttendanceTab filters={filters} /> : null}
      {tab === "store" ? <StoreTab filters={filters} /> : null}
    </div>
  );
}
