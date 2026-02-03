import React, { useEffect, useMemo, useRef, useState } from "react";
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

/** ✅ YYYY-MM-DD en zona Lima (en-CA => 2026-02-02) */
function ymdLima(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(d);
}

/** ✅ Sumar días manteniendo la fecha en Lima (sin desfase) */
function addDaysYmdLima(baseYmd: string, delta: number): string {
  // Lima no tiene DST, usamos -05:00 para que no se “mueva” por timezone local del navegador
  const dt = new Date(`${baseYmd}T12:00:00-05:00`);
  dt.setDate(dt.getDate() + delta);
  return ymdLima(dt);
}

function firstDayOfMonthYmdLima(): string {
  const today = ymdLima();
  return `${today.slice(0, 7)}-01`;
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
  data: Array<{ label: string; value: number; tip?: string }>;
  format?: (v: number) => string;
  totalLabel?: string;
}) {
  const { title, subtitle, data, format, totalLabel } = props;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="dash-panel">
      <div className="dash-panel-head">
        <div className="dash-panel-title">{title}</div>
        <div className="dash-panel-subRow">
          {subtitle ? <div className="dash-panel-sub">{subtitle}</div> : <div />}
          <div className="dash-panel-total">
            {totalLabel ? totalLabel : "Total"}:{" "}
            <b>{format ? format(total) : String(total)}</b>
          </div>
        </div>
      </div>

      <div className="dash-chart">
        {data.map((d) => {
          const h = Math.round((d.value / max) * 100);
          return (
            <div key={d.label} className="dash-bar" title={d.tip ?? `${d.label}: ${format ? format(d.value) : d.value}`}>
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

  // ✅ loaders por sección
  const [busyStudents, setBusyStudents] = useState(false);
  const [busyReports, setBusyReports] = useState(false);

  // error general + warnings por sección
  const [err, setErr] = useState<string | null>(null);
  const [warnStudents, setWarnStudents] = useState<string | null>(null);
  const [warnReports, setWarnReports] = useState<string | null>(null);

  // stats
  const [studentsTotal, setStudentsTotal] = useState<number>(0);
  const [studentsActive, setStudentsActive] = useState<number>(0);
  const [studentsInactive, setStudentsInactive] = useState<number>(0);
  const [enrActive, setEnrActive] = useState<number>(0);
  const [enrEnded, setEnrEnded] = useState<number>(0);
  const [latestStudents, setLatestStudents] = useState<Student[]>([]);

  // reportes
  const [financeRows, setFinanceRows] = useState<FinanceRow[]>([]);
  const [installmentRows, setInstallmentRows] = useState<InstallmentRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [storeRows, setStoreRows] = useState<StoreRow[]>([]);

  // evita setState si sales de la página
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ✅ Fechas Lima (consistentes)
  const monthTo = ymdLima();
  const monthFrom = firstDayOfMonthYmdLima();
  const last14From = addDaysYmdLima(monthTo, -13);
  const last7From = addDaysYmdLima(monthTo, -6);

  async function loadStudentsBlock() {
    setWarnStudents(null);
    setBusyStudents(true);

    try {
      const results = await Promise.allSettled([
        listStudents({ page: 1, perPage: 1, active: "" }),
        listStudents({ page: 1, perPage: 1, active: "1" }),
        listStudents({ page: 1, perPage: 1, active: "0" }),
        listEnrollments({ page: 1, perPage: 1, status: "active" as EnrollmentStatus }),
        listEnrollments({ page: 1, perPage: 1, status: "ended" as EnrollmentStatus }),
        listStudents({ page: 1, perPage: 8, active: "" }),
      ]);

      const [stAll, stAct, stInact, eAct, eEnd, stLatest] = results;

      const pick = <T,>(r: PromiseSettledResult<T>): T | null =>
        r.status === "fulfilled" ? r.value : null;

      const a = pick(stAll);
      const b = pick(stAct);
      const c = pick(stInact);
      const d = pick(eAct);
      const e = pick(eEnd);
      const f = pick(stLatest);

      if (!aliveRef.current) return;

      setStudentsTotal((a as any)?.total ?? 0);
      setStudentsActive((b as any)?.total ?? 0);
      setStudentsInactive((c as any)?.total ?? 0);
      setEnrActive((d as any)?.total ?? 0);
      setEnrEnded((e as any)?.total ?? 0);
      setLatestStudents((f as any)?.data ?? []);

      // warning si algo falló
      const anyRejected = results.some((r) => r.status === "rejected");
      if (anyRejected) setWarnStudents("Algunas métricas de alumnos no pudieron cargarse (revisa API).");
    } finally {
      if (aliveRef.current) setBusyStudents(false);
    }
  }

  async function loadReportsBlock() {
    setWarnReports(null);
    setBusyReports(true);

    try {
      const base: ReportFilters = {
        from: monthFrom,
        to: monthTo,
        category_id: "",
        method: "",
        status: "",
        q: "",
        group_by: "day",
      };

      const last14: ReportFilters = { ...base, from: last14From, to: monthTo };
      const last7: ReportFilters = { ...base, from: last7From, to: monthTo };

      const results = await Promise.allSettled([
        reportsApi.financeList(last14),
        reportsApi.installmentsList(base),
        reportsApi.attendanceList(last7),
        reportsApi.storeList(base),
      ]);

      const pick = <T,>(r: PromiseSettledResult<T>): T | null =>
        r.status === "fulfilled" ? r.value : null;

      const fin = pick(results[0]);
      const inst = pick(results[1]);
      const att = pick(results[2]);
      const store = pick(results[3]);

      if (!aliveRef.current) return;

      setFinanceRows((fin as any)?.rows ?? []);
      setInstallmentRows((inst as any)?.rows ?? []);
      setAttendanceRows((att as any)?.rows ?? []);
      setStoreRows((store as any)?.rows ?? []);

      const anyRejected = results.some((r) => r.status === "rejected");
      if (anyRejected) setWarnReports("Algunos reportes no pudieron cargarse (revisa endpoints /api/reports/*).");
    } finally {
      if (aliveRef.current) setBusyReports(false);
    }
  }

  async function loadAll() {
    setErr(null);
    // cargamos en paralelo y no “rompemos” todo si falla una parte
    await Promise.allSettled([loadStudentsBlock(), loadReportsBlock()]);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ KPIs
  const income14Cents = useMemo(() => sumPaidCents(financeRows), [financeRows]);
  const storeMonthCents = useMemo(() => sumOrderCents(storeRows), [storeRows]);

  const overdue = useMemo(() => {
    const today = ymdLima();
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
    const map = new Map<
      string,
      { key: string; name: string; dni: string; category: string; debt: number; late: number }
    >();

    overdue.forEach((r) => {
      const name = String((r as any).student_name ?? "—");
      const dni = String((r as any).document_number ?? "—");
      const cat = String((r as any).category_name ?? "—");
      const key = `${dni}__${name}`;

      const debt = remainingCents(r);
      const late = Number((r as any).days_late ?? 0);

      const prev = map.get(key);
      if (!prev) map.set(key, { key, name, dni, category: cat, debt, late });
      else {
        prev.debt += debt;
        prev.late = Math.max(prev.late, late);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.debt - a.debt).slice(0, 6);
  }, [overdue]);

  // ✅ series ingresos 14 días
  const income14Series = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => addDaysYmdLima(last14From, i));
    const sums = new Map<string, number>();

    financeRows.forEach((r) => {
      const d = ymd(r.paid_on);
      if (!d) return;
      sums.set(d, (sums.get(d) ?? 0) + Number(r.paid_cents ?? 0));
    });

    return days.map((d) => {
      const v = sums.get(d) ?? 0;
      return {
        label: d.slice(5), // MM-DD
        value: v,
        tip: `${d} • ${moneyPENFromCents(v)}`,
      };
    });
  }, [financeRows, last14From]);

  // ✅ series asistencia 7 días
  const attendance7Series = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDaysYmdLima(last7From, i));
    const sums = new Map<string, number>();

    attendanceRows.forEach((r) => {
      const d = ymd((r as any).date);
      if (!d) return;
      sums.set(d, (sums.get(d) ?? 0) + 1);
    });

    return days.map((d) => {
      const v = sums.get(d) ?? 0;
      return {
        label: d.slice(5),
        value: v,
        tip: `${d} • ${v} asistencias`,
      };
    });
  }, [attendanceRows, last7From]);

  const stats: Stat[] = useMemo(
    () => [
      { label: "Estudiantes", value: String(studentsTotal), hint: "Total registrados", icon: <Users size={18} />, tone: "info" },
      { label: "Activos", value: String(studentsActive), hint: "Cuentas activas", icon: <UserCheck size={18} />, tone: "ok" },
      { label: "Inactivos", value: String(studentsInactive), hint: "Cuentas inactivas", icon: <UserX size={18} />, tone: "warn" },
      { label: "Matrículas activas", value: String(enrActive), hint: "Status = active", icon: <GraduationCap size={18} />, tone: "ok" },
      { label: "Finalizadas", value: String(enrEnded), hint: "Status = ended", icon: <CalendarDays size={18} />, tone: "info" },
    ],
    [studentsTotal, studentsActive, studentsInactive, enrActive, enrEnded]
  );

  const anyBusy = busyStudents || busyReports;

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-sub">
            Hora Perú (Lima): <b>{formatLimaNow(now)}</b>
          </div>
          <div className="dash-sub2">
            Rango reportes: <span className="mono">{monthFrom}</span> → <span className="mono">{monthTo}</span>
          </div>
        </div>

        <div className="dash-actions">
          <button className="dash-btn" onClick={() => navigate("/reports")} title="Ir a Reportes">
            <BarChart3 size={16} />
            <span>Reportes</span>
          </button>

          <button className="dash-btn" onClick={loadAll} disabled={anyBusy}>
            <RefreshCw size={16} className={anyBusy ? "spin" : ""} />
            <span>{anyBusy ? "Actualizando..." : "Refrescar"}</span>
          </button>
        </div>
      </div>

      {err && <div className="dash-alert">{err}</div>}
      {warnStudents && <div className="dash-warn">{warnStudents}</div>}
      {warnReports && <div className="dash-warn">{warnReports}</div>}

      {/* Stats */}
      <section className="dash-grid">
        {stats.map((s) => (
          <div key={s.label} className={`dash-card ${s.tone ?? ""}`}>
            <div className="dash-card-ico">{s.icon}</div>
            <div className="dash-card-body">
              <div className="dash-card-label">{s.label}</div>
              <div className="dash-card-value">
                {busyStudents ? <span className="skeleton w60" /> : s.value}
              </div>
              {s.hint && <div className="dash-card-hint">{s.hint}</div>}
            </div>
          </div>
        ))}

        {/* KPIs */}
        <div className="dash-card info">
          <div className="dash-card-ico">
            <Wallet size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Ingresos (14 días)</div>
            <div className="dash-card-value">
              {busyReports ? <span className="skeleton w80" /> : moneyPENFromCents(income14Cents)}
            </div>
            <div className="dash-card-hint">Pagos registrados (cuotas + matrícula)</div>
          </div>
        </div>

        <div className="dash-card warn">
          <div className="dash-card-ico">
            <AlertTriangle size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Deuda vencida</div>
            <div className="dash-card-value">
              {busyReports ? <span className="skeleton w80" /> : moneyPENFromCents(overdueDebtCents)}
            </div>
            <div className="dash-card-hint">{busyReports ? "—" : `${overdue.length} cuotas vencidas`}</div>
          </div>
        </div>

        <div className="dash-card ok">
          <div className="dash-card-ico">
            <ShoppingCart size={18} />
          </div>
          <div className="dash-card-body">
            <div className="dash-card-label">Tienda (mes)</div>
            <div className="dash-card-value">
              {busyReports ? <span className="skeleton w80" /> : moneyPENFromCents(storeMonthCents)}
            </div>
            <div className="dash-card-hint">{busyReports ? "—" : `${storeRows.length} pedidos listados`}</div>
          </div>
        </div>
      </section>

      {/* Charts + Quick */}
      <section className="dash-three">
        <MiniBars
          title="Ingresos últimos 14 días"
          subtitle={`${last14From} → ${monthTo}`}
          data={income14Series}
          format={(v) => `S/ ${(v / 100).toFixed(0)}`}
          totalLabel="Total 14d"
        />

        <MiniBars
          title="Asistencia últimos 7 días"
          subtitle={`${last7From} → ${monthTo}`}
          data={attendance7Series}
          format={(v) => String(v)}
          totalLabel="Total 7d"
        />

        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Accesos rápidos</div>
            <div className="dash-panel-sub">Atajos del panel</div>
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
            * Gráficas/KPIs usan endpoints <span className="mono">/api/reports/*</span>.
          </div>
        </div>
      </section>

      {/* Lists */}
      <section className="dash-two">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Top morosos (deuda vencida)</div>
            <div className="dash-panel-sub">Cuotas con due_on &lt; hoy (Lima)</div>
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
                  <th className="tr">Acción</th>
                </tr>
              </thead>
              <tbody>
                {busyReports ? (
                  <tr>
                    <td colSpan={6} className="empty">Cargando morosidad...</td>
                  </tr>
                ) : (
                  <>
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
                        <td className="tr">
                          <button className="dash-btn ghost sm" onClick={() => navigate("/reports")}>
                            Ver
                            <ArrowUpRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {topDebtors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="empty">
                          No hay morosidad (o aún no hay cuotas cargadas).
                        </td>
                      </tr>
                    )}
                  </>
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

        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Últimos estudiantes</div>
            <div className="dash-panel-sub">Click para abrir ficha</div>
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
                {busyStudents ? (
                  <tr>
                    <td colSpan={3} className="empty">Cargando...</td>
                  </tr>
                ) : (
                  <>
                    {latestStudents.map((s) => {
                      const full = `${(s as any).first_name ?? ""} ${(s as any).last_name ?? ""}`.trim() || (s as any).name || "—";
                      const dni = (s as any).document_number ?? (s as any).dni ?? "—";
                      const active = (s as any).is_active === true || (s as any).is_active === 1 || (s as any).is_active === "1";

                      return (
                        <tr
                          key={(s as any).id}
                          className="row-click"
                          onClick={() => navigate(`/students/${(s as any).id}/enrollment-sheet`)}
                          title="Abrir ficha"
                        >
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
                        <td colSpan={3} className="empty">No hay datos.</td>
                      </tr>
                    )}
                  </>
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

      {anyBusy ? <div className="dash-loading">Actualizando datos...</div> : null}
    </div>
  );
}
