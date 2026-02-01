import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  ClipboardCheck,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Wallet,
  FileText,
} from "lucide-react";

import "./Dashboard.css";

import { listStudents } from "../services/students";
import type { Student } from "../services/students";

import { listEnrollments } from "../services/enrollments";
import type { EnrollmentStatus } from "../services/enrollments";

import { reportsApi } from "./Reports/reportsService";
import type { FinanceRow, InstallmentRow, AttendanceRow, StoreRow, ReportFilters } from "./Reports/types";

import { moneyPENFromCents } from "./Students/utils/money";

/** Hora exacta Perú (Lima) */
function formatLimaNow(d: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

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

function addDaysYmd(baseYmd: string, delta: number) {
  const d = new Date(baseYmd + "T00:00:00");
  d.setDate(d.getDate() + delta);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ymd(v: any) {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.slice(0, 10) : s.slice(0, 10);
}

function sumPaidCents(rows: FinanceRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.paid_cents ?? 0), 0);
}

function sumOrderCents(rows: StoreRow[]) {
  return rows.reduce((acc, r) => acc + Number(r.total_cents ?? 0), 0);
}

function remainingCents(r: InstallmentRow) {
  return Math.max(0, Number(r.amount_cents ?? 0) - Number(r.paid_cents ?? 0));
}

type Stat = {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone?: "ok" | "warn" | "info";
};

function MiniBars(props: {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: number }>;
  format?: (v: number) => string;
}) {
  const { title, subtitle, data, format } = props;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <div className="dash-panel-title">{title}</div>
        {subtitle ? <div className="dash-panel-sub">{subtitle}</div> : null}
      </div>

      <div className="dash-chart">
        {data.map((d) => {
          const h = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="dash-bar">
              <div className="dash-bar-col">
                <div className="dash-bar-fill" style={{ height: `${h}%` }} />
              </div>
              <div className="dash-bar-label">{d.label}</div>
              <div className="dash-bar-value">{format ? format(d.value) : String(d.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // stats (lo tuyo)
  const [studentsTotal, setStudentsTotal] = useState<number>(0);
  const [studentsActive, setStudentsActive] = useState<number>(0);
  const [studentsInactive, setStudentsInactive] = useState<number>(0);
  const [enrActive, setEnrActive] = useState<number>(0);
  const [enrEnded, setEnrEnded] = useState<number>(0);
  const [latestStudents, setLatestStudents] = useState<Student[]>([]);

  // ✅ reportes (nuevo)
  const [financeRows, setFinanceRows] = useState<FinanceRow[]>([]);
  const [installmentRows, setInstallmentRows] = useState<InstallmentRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const monthFrom = firstDayOfMonthYmd();
  const monthTo = todayYmd();
  const last14From = addDaysYmd(monthTo, -13); // 14 días contando hoy
  const last7From = addDaysYmd(monthTo, -6);

  async function load() {
    setBusy(true);
    setErr(null);

    try {
      // ✅ tu carga original
      const [stAll, stAct, stInact, eAct, eEnd, stLatest] = await Promise.all([
        listStudents({ page: 1, perPage: 1, active: "" }),
        listStudents({ page: 1, perPage: 1, active: "1" }),
        listStudents({ page: 1, perPage: 1, active: "0" }),
        listEnrollments({ page: 1, perPage: 1, status: "active" as EnrollmentStatus }),
        listEnrollments({ page: 1, perPage: 1, status: "ended" as EnrollmentStatus }),
        listStudents({ page: 1, perPage: 8, active: "" }),
      ]);

      setStudentsTotal(stAll.total ?? 0);
      setStudentsActive(stAct.total ?? 0);
      setStudentsInactive(stInact.total ?? 0);
      setEnrActive(eAct.total ?? 0);
      setEnrEnded(eEnd.total ?? 0);
      setLatestStudents(stLatest.data ?? []);

      // ✅ Reportes: usamos LIST para poder graficar
      const base: ReportFilters = { from: monthFrom, to: monthTo, category_id: "", method: "", status: "", q: "", group_by: "day" };
      const last14: ReportFilters = { ...base, from: last14From, to: monthTo };
      const last7: ReportFilters = { ...base, from: last7From, to: monthTo };

      const [fin, inst, att, store] = await Promise.all([
        reportsApi.financeList(last14),          // últimos 14 días para gráfica
        reportsApi.installmentsList(base),       // todo el mes para morosidad (puedes ajustar)
        reportsApi.attendanceList(last7),        // últimos 7 días
        reportsApi.storeList(base),              // tienda mes
      ]);

      setFinanceRows(fin?.rows ?? []);
      setInstallmentRows(inst?.rows ?? []);
      setAttendanceRows(att?.rows ?? []);
      setStoreRows(store?.rows ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Error cargando dashboard");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ KPIs nuevos
  const income14Cents = useMemo(() => sumPaidCents(financeRows), [financeRows]);
  const storeMonthCents = useMemo(() => sumOrderCents(storeRows), [storeRows]);

  const overdue = useMemo(() => {
    const today = todayYmd();
    return installmentRows.filter((r) => {
      const d = ymd(r.due_on);
      const rem = remainingCents(r);
      return rem > 0 && d && d < today;
    });
  }, [installmentRows]);

  const overdueDebtCents = useMemo(
    () => overdue.reduce((acc, r) => acc + remainingCents(r), 0),
    [overdue]
  );

  const topDebtors = useMemo(() => {
    // agrupar por alumno (dni+nombre)
    const map = new Map<string, { key: string; name: string; dni: string; category: string; debt: number; late: number }>();

    overdue.forEach((r) => {
      const name = String(r.student_name ?? "—");
      const dni = String(r.document_number ?? "—");
      const cat = String(r.category_name ?? "—");
      const key = `${dni}__${name}`;

      const debt = remainingCents(r);
      const late = Number(r.days_late ?? 0);

      const prev = map.get(key);
      if (!prev) {
        map.set(key, { key, name, dni, category: cat, debt, late });
      } else {
        prev.debt += debt;
        prev.late = Math.max(prev.late, late);
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 6);
  }, [overdue]);

  // ✅ series para bar chart ingresos 14 días
  const income14Series = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDaysYmd(last14From, i));
    const sums = new Map<string, number>();
    financeRows.forEach((r) => {
      const d = ymd(r.paid_on);
      if (!d) return;
      sums.set(d, (sums.get(d) ?? 0) + Number(r.paid_cents ?? 0));
    });

    return days.map((d) => ({
      label: d.slice(5), // MM-DD
      value: sums.get(d) ?? 0,
    }));
  }, [financeRows, last14From]);

  const attendance7Series = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDaysYmd(last7From, i));
    const sums = new Map<string, number>();
    attendanceRows.forEach((r) => {
      const d = ymd(r.date);
      if (!d) return;
      sums.set(d, (sums.get(d) ?? 0) + 1);
    });

    return days.map((d) => ({
      label: d.slice(5),
      value: sums.get(d) ?? 0,
    }));
  }, [attendanceRows, last7From]);

  const stats: Stat[] = useMemo(
    () => [
      {
        label: "Estudiantes",
        value: String(studentsTotal),
        hint: "Total registrados",
        icon: <Users size={18} />,
        tone: "info",
      },
      {
        label: "Activos",
        value: String(studentsActive),
        hint: "Cuentas activas",
        icon: <UserCheck size={18} />,
        tone: "ok",
      },
      {
        label: "Inactivos",
        value: String(studentsInactive),
        hint: "Cuentas inactivas",
        icon: <UserX size={18} />,
        tone: "warn",
      },
      {
        label: "Matrículas activas",
        value: String(enrActive),
        hint: "Status = active",
        icon: <GraduationCap size={18} />,
        tone: "ok",
      },
      {
        label: "Finalizadas",
        value: String(enrEnded),
        hint: "Status = ended",
        icon: <CalendarDays size={18} />,
        tone: "info",
      },
    ],
    [studentsTotal, studentsActive, studentsInactive, enrActive, enrEnded]
  );

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-sub">
            Hora Perú (Lima): <b>{formatLimaNow(now)}</b>
          </div>
        </div>

        <div className="dash-actions">
          <button className="dash-btn" onClick={() => navigate("/reports")} title="Ir a Reportes">
            <BarChart3 size={16} />
            <span>Reportes</span>
          </button>

          <button className="dash-btn" onClick={load} disabled={busy}>
            <RefreshCw size={16} className={busy ? "spin" : ""} />
            <span>{busy ? "Cargando..." : "Refrescar"}</span>
          </button>
        </div>
      </div>

      {err && <div className="dash-alert">{err}</div>}

      {/* ✅ tus stats (igual) */}
      <section className="dash-grid">
        {stats.map((s) => (
          <div key={s.label} className={`dash-card ${s.tone ?? ""}`}>
            <div className="dash-card-ico">{s.icon}</div>
            <div className="dash-card-body">
              <div className="dash-card-label">{s.label}</div>
              <div className="dash-card-value">{s.value}</div>
              {s.hint && <div className="dash-card-hint">{s.hint}</div>}
            </div>
          </div>
        ))}

        {/* ✅ KPIs nuevos */}
        <div className="dash-card info">
          <div className="dash-card-ico">
            <Wallet size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Ingresos (14 días)</div>
            <div className="dash-card-value">{moneyPENFromCents(income14Cents)}</div>
            <div className="dash-card-hint">Pagos registrados (cuotas + matrícula)</div>
          </div>
        </div>

        <div className="dash-card warn">
          <div className="dash-card-ico">
            <AlertTriangle size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Deuda vencida</div>
            <div className="dash-card-value">{moneyPENFromCents(overdueDebtCents)}</div>
            <div className="dash-card-hint">{overdue.length} cuotas vencidas</div>
          </div>
        </div>

        <div className="dash-card ok">
          <div className="dash-card-ico">
            <ShoppingCart size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Tienda (mes)</div>
            <div className="dash-card-value">{moneyPENFromCents(storeMonthCents)}</div>
            <div className="dash-card-hint">{storeRows.length} pedidos listados</div>
          </div>
        </div>
      </section>

      {/* ✅ Gráficas */}
      <section className="dash-three">
        <MiniBars
          title="Ingresos últimos 14 días"
          subtitle={`${last14From} → ${monthTo}`}
          data={income14Series}
          format={(v) => (v ? `S/ ${(v / 100).toFixed(0)}` : "—")}
        />

        <MiniBars
          title="Asistencia últimos 7 días"
          subtitle={`${last7From} → ${monthTo}`}
          data={attendance7Series}
          format={(v) => String(v)}
        />

        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Accesos rápidos</div>
          </div>

          <div className="dash-quick">
            <button className="dash-quick-btn" onClick={() => navigate("/students")}>
              <Users size={18} />
              <span>Estudiantes</span>
              <ArrowUpRight size={16} className="muted" />
            </button>

            <button className="dash-quick-btn" onClick={() => navigate("/attendance")}>
              <ClipboardCheck size={18} />
              <span>Asistencia</span>
              <ArrowUpRight size={16} className="muted" />
            </button>

            <button className="dash-quick-btn" onClick={() => navigate("/store")}>
              <ShoppingCart size={18} />
              <span>Tienda</span>
              <ArrowUpRight size={16} className="muted" />
            </button>

            <button className="dash-quick-btn" onClick={() => navigate("/reports")}>
              <FileText size={18} />
              <span>Reportes</span>
              <ArrowUpRight size={16} className="muted" />
            </button>
          </div>

          <div className="dash-note">
            * Este dashboard usa los endpoints /api/reports/* para gráficos y KPIs.
          </div>
        </div>
      </section>

      {/* ✅ Listas */}
      <section className="dash-two">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Top morosos (deuda vencida)</div>
            <div className="dash-panel-sub">Basado en cuotas con due_on &lt; hoy</div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Categoría</th>
                  <th className="tr">Deuda</th>
                  <th className="tr">Atraso</th>
                </tr>
              </thead>
              <tbody>
                {topDebtors.map((d) => (
                  <tr key={d.key}>
                    <td className="name">{d.name}</td>
                    <td className="mono">{d.dni}</td>
                    <td>{d.category}</td>
                    <td className="tr">
                      <span className="money">{moneyPENFromCents(d.debt)}</span>
                    </td>
                    <td className="tr">
                      <span className="pill warn">{d.late}d</span>
                    </td>
                  </tr>
                ))}

                {topDebtors.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      No hay morosidad (o aún no hay cuotas cargadas).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dash-panel-foot">
            <button className="dash-btn ghost" onClick={() => navigate("/reports")}>
              Ver en Reportes
              <TrendingUp size={16} />
            </button>
          </div>
        </div>

        {/* ✅ tu panel de últimos estudiantes (igual pero mejorado con click) */}
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Últimos estudiantes</div>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {latestStudents.map((s) => {
                  const full = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "—";
                  const dni = (s as any).document_number ?? "—";
                  const active = s.is_active === true || s.is_active === (1 as any) || s.is_active === ("1" as any);

                  return (
                    <tr key={s.id} className="row-click" onClick={() => navigate(`/students`)}>
                      <td className="name">{full}</td>
                      <td className="mono">{dni}</td>
                      <td>
                        <span className={`pill ${active ? "ok" : "bad"}`}>{active ? "ACTIVO" : "INACTIVO"}</span>
                      </td>
                    </tr>
                  );
                })}

                {latestStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty">
                      No hay datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="dash-panel-foot">
            <button className="dash-btn ghost" onClick={() => navigate("/students")}>
              Ver todos
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {busy ? <div className="dash-loading">Actualizando datos...</div> : null}
    </div>
  );
}


