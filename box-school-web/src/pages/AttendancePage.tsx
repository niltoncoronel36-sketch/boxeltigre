import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getTodayAttendances, scanAttendance, getAttendanceHistory } from "../services/attendance";
import type { AttendanceTodayItem } from "../services/attendance";
import { getApiErrorMessage } from "../services/api";

import {
  IdCard,
  ScanLine,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  CalendarDays,
  Clock,
} from "lucide-react";

import "./AttendancePage.css";

const LIMA_TZ = "America/Lima";

function fmtDateOnly(v: any) {
  if (!v) return "—";
  const s = String(v);
  if (s.includes("T")) return s.split("T")[0];
  if (s.includes(" ")) return s.split(" ")[0];
  return s.slice(0, 10);
}

function fmtTimeOnly(t?: string | null) {
  if (!t) return "—";
  const s = String(t).trim();
  return s.length >= 8 ? s.slice(0, 8) : s;
}

type Status = { type: "ok" | "warn" | "err"; text: string } | null;

export default function AttendancePage() {
  const { roles, loading } = useAuth();

  const roleKeys = useMemo(() => (roles ?? []).map((r: any) => r?.key), [roles]);
  const canAttendance = useMemo(
    () => roleKeys.includes("admin") || roleKeys.includes("attendance_controller"),
    [roleKeys]
  );

  // ✅ Formateadores Lima (rápidos y consistentes)
  const limaTimeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        timeZone: LIMA_TZ,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    []
  );

  const limaDateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-PE", {
        timeZone: LIMA_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    []
  );

  function fmtLimaTime(d: Date) {
    return limaTimeFmt.format(d);
  }
  function fmtLimaDate(d: Date) {
    return limaDateFmt.format(d);
  }
  function fmtLimaDateTime(d: Date) {
    return `${fmtLimaDate(d)} ${fmtLimaTime(d)}`;
  }

  const scanRef = useRef<HTMLInputElement | null>(null);

  const [tab, setTab] = useState<"today" | "history">("today");

  const [dni, setDni] = useState("");
  const [busyScan, setBusyScan] = useState(false);
  const [busyList, setBusyList] = useState(false);

  const [status, setStatus] = useState<Status>(null);

  // ✅ Reloj en vivo (Lima)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // HOY
  const [items, setItems] = useState<AttendanceTodayItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // HISTORIAL
  const [hItems, setHItems] = useState<AttendanceTodayItem[]>([]);
  const [hSearch, setHSearch] = useState("");
  const [hFrom, setHFrom] = useState("");
  const [hTo, setHTo] = useState("");
  const [hPage, setHPage] = useState(1);
  const [hPages, setHPages] = useState(1);

  function focusScan() {
    requestAnimationFrame(() => scanRef.current?.focus());
  }

  function showError(where: string, err: unknown, alsoAlert = false) {
    const msg = getApiErrorMessage(err);
    const text = `${where}: ${msg}`;
    console.error(`[AttendancePage] ${where}`, err);
    setStatus({ type: "err", text: `❌ ${text}` });
    if (alsoAlert) alert(text);
  }

  function showInfo(text: string) {
    setStatus({ type: "warn", text: `⚠️ ${text}` });
  }

  async function loadToday(nextPage = 1, nextSearch = search, showAlertOnFail = false) {
    setBusyList(true);
    try {
      const res = await getTodayAttendances({
        page: nextPage,
        search: nextSearch || undefined,
      });

      if (!res || !res.data || !Array.isArray(res.data.data)) {
        showInfo("Respuesta inesperada del servidor en HOY.");
        console.log("Respuesta HOY:", res);
        return;
      }

      const p = res.data;
      setItems(p.data);
      setPage(p.current_page);
      setPages(p.last_page);
    } catch (e) {
      showError("Buscar HOY falló", e, showAlertOnFail);
    } finally {
      setBusyList(false);
    }
  }

  async function loadHistory(nextPage = 1, showAlertOnFail = false) {
    setBusyList(true);
    try {
      const res = await getAttendanceHistory({
        page: nextPage,
        search: hSearch || undefined,
        from: hFrom || undefined,
        to: hTo || undefined,
      });

      if (!res || !res.data || !Array.isArray(res.data.data)) {
        showInfo("Respuesta inesperada del servidor en HISTORIAL.");
        console.log("Respuesta HISTORIAL:", res);
        return;
      }

      const p = res.data;
      setHItems(p.data);
      setHPage(p.current_page);
      setHPages(p.last_page);
    } catch (e) {
      showError("Historial falló", e, showAlertOnFail);
    } finally {
      setBusyList(false);
    }
  }

  useEffect(() => {
    loadToday(1, "", false);
    focusScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "today") {
      focusScan();
    } else {
      loadHistory(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function onScanSubmit(value: string) {
    if (busyScan) return;

    const clean = String(value ?? "").trim().replace(/\s+/g, "");
    if (!clean) return;

    // ✅ Hora exacta en el momento del scan (Lima)
    const stampedAt = new Date();

    setBusyScan(true);
    try {
      const res = await scanAttendance(clean);

      const hora = fmtLimaTime(stampedAt);

      if (res.action === "check_in") {
        setStatus({
          type: "ok",
          text: `✅ Entrada registrada • ${res.user?.name} (${res.user?.dni}) • ${hora} (Lima)`,
        });
      } else if (res.action === "check_out") {
        setStatus({
          type: "ok",
          text: `🟠 Salida registrada • ${res.user?.name} (${res.user?.dni}) • ${hora} (Lima)`,
        });
      } else {
        setStatus({
          type: "warn",
          text: `⚠️ Ya registró hoy • ${res.user?.name} (${res.user?.dni}) • ${hora} (Lima)`,
        });
      }

      setDni("");
      await loadToday(1, search, false);
    } catch (e) {
      showError("Escaneo falló", e, true);
    } finally {
      setBusyScan(false);
      if (tab === "today") focusScan();
    }
  }

  if (loading) return null;
  if (!canAttendance) return <Navigate to="/admin" replace />;

  const StatusIcon =
    status?.type === "ok" ? CheckCircle2 : status?.type === "warn" ? AlertTriangle : XCircle;

  return (
    <div className="att-page">
      <div className="att-header">
        <div>
          <div className="att-title">Asistencia</div>
          <div className="att-subtitle">Búsqueda e historial con fechas y horas legibles.</div>

          {/* ✅ Reloj Lima */}
          <div className="att-clock">
            <Clock size={16} />
            <span>
              Hora Perú (Lima): <b>{fmtLimaDateTime(now)}</b>
            </span>
          </div>
        </div>

        <div className="att-tabs">
          <button className={`att-tab ${tab === "today" ? "active" : ""}`} onClick={() => setTab("today")}>
            <ScanLine size={16} />
            <span>Hoy</span>
          </button>

          <button className={`att-tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
            <History size={16} />
            <span>Historial</span>
          </button>

          <button
            className="att-btn att-btn-ghost"
            onClick={() => (tab === "today" ? loadToday(1, search, true) : loadHistory(1, true))}
            disabled={busyScan || busyList}
          >
            <RefreshCw size={18} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {status && (
        <div className={`att-status ${status.type}`}>
          <StatusIcon size={18} />
          <span>{status.text}</span>
        </div>
      )}

      {tab === "today" && (
        <div className="att-grid">
          <section className="att-card">
            <div className="att-card-head">
              <div>
                <div className="att-pill">
                  <ScanLine size={16} />
                  <span>Escaneo</span>
                </div>
                <div className="att-card-title">Registro rápido</div>
                <div className="att-card-desc">El input está listo para el lector.</div>
              </div>
            </div>

            <label className="att-label">DNI</label>
            <div className="att-input-wrap">
              <IdCard className="att-input-ico" size={18} />
              <input
                ref={scanRef}
                className="att-input"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onScanSubmit(dni)}
                placeholder="Escanea aquí…"
                autoComplete="off"
                spellCheck={false}
                inputMode="numeric"
              />
              <button
                className="att-btn att-btn-primary"
                onClick={() => onScanSubmit(dni)}
                disabled={busyScan || !dni.trim()}
              >
                {busyScan ? <RefreshCw className="att-spin" size={18} /> : <ScanLine size={18} />}
                <span>{busyScan ? "Registrando…" : "Registrar"}</span>
              </button>
            </div>
          </section>

          <section className="att-card">
            <div className="att-card-head">
              <div>
                <div className="att-pill">
                  <Search size={16} />
                  <span>Hoy</span>
                </div>
                <div className="att-card-title">Buscar (hoy)</div>
                <div className="att-card-desc">Nombre / DNI / email</div>
              </div>
            </div>

            <label className="att-label">Buscar</label>
            <div className="att-input-wrap">
              <Search className="att-input-ico" size={18} />
              <input
                className="att-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadToday(1, search, true)}
                placeholder="Ej: 12345678 o Juan..."
              />
              <button
                className="att-btn att-btn-primary"
                onClick={() => loadToday(1, search, true)}
                disabled={busyList || busyScan}
              >
                <Search size={18} />
                <span>Buscar</span>
              </button>
            </div>

            <div className="att-table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>Persona</th>
                    <th>DNI</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Actualizado (Lima)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="att-td-name">{it.user?.name}</td>
                      <td className="att-td-mono">{it.user?.dni}</td>
                      <td className="att-td-mono">{fmtTimeOnly(it.check_in_time)}</td>
                      <td className="att-td-mono">{fmtTimeOnly(it.check_out_time)}</td>
                      <td className="att-td-mono">
                        {it.updated_at ? fmtLimaTime(new Date(it.updated_at)) : "—"}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="att-empty">No hay registros hoy.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="att-pagination">
              <button
                className="att-btn att-btn-ghost"
                onClick={() => loadToday(Math.max(1, page - 1), search, true)}
                disabled={busyList || page <= 1}
              >
                ← <span>Anterior</span>
              </button>

              <div className="att-pageinfo">
                Página <b>{page}</b> / <b>{pages}</b>
              </div>

              <button
                className="att-btn att-btn-ghost"
                onClick={() => loadToday(Math.min(pages, page + 1), search, true)}
                disabled={busyList || page >= pages}
              >
                <span>Siguiente</span> →
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === "history" && (
        <section className="att-card">
          <div className="att-card-head">
            <div>
              <div className="att-pill">
                <History size={16} />
                <span>Historial</span>
              </div>
              <div className="att-card-title">Todos los registros</div>
              <div className="att-card-desc">Filtra por fechas y búsqueda</div>
            </div>
          </div>

          <div className="att-history-filters">
            <div className="att-input-wrap">
              <Search className="att-input-ico" size={18} />
              <input
                className="att-input"
                value={hSearch}
                onChange={(e) => setHSearch(e.target.value)}
                placeholder="Nombre / DNI / email…"
              />
            </div>

            <div className="att-input-wrap">
              <CalendarDays className="att-input-ico" size={18} />
              <input className="att-input" type="date" value={hFrom} onChange={(e) => setHFrom(e.target.value)} />
            </div>

            <div className="att-input-wrap">
              <CalendarDays className="att-input-ico" size={18} />
              <input className="att-input" type="date" value={hTo} onChange={(e) => setHTo(e.target.value)} />
            </div>

            <button className="att-btn att-btn-primary" onClick={() => loadHistory(1, true)} disabled={busyList}>
              <Search size={18} />
              <span>Aplicar</span>
            </button>
          </div>

          <div className="att-table-wrap">
            <table className="att-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Persona</th>
                  <th>DNI</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                </tr>
              </thead>
              <tbody>
                {hItems.map((it) => (
                  <tr key={it.id}>
                    <td className="att-td-mono">{fmtDateOnly(it.date)}</td>
                    <td className="att-td-name">{it.user?.name}</td>
                    <td className="att-td-mono">{it.user?.dni}</td>
                    <td className="att-td-mono">{fmtTimeOnly(it.check_in_time)}</td>
                    <td className="att-td-mono">{fmtTimeOnly(it.check_out_time)}</td>
                  </tr>
                ))}
                {hItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="att-empty">No hay registros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="att-pagination">
            <button
              className="att-btn att-btn-ghost"
              onClick={() => loadHistory(Math.max(1, hPage - 1), true)}
              disabled={busyList || hPage <= 1}
            >
              ← <span>Anterior</span>
            </button>

            <div className="att-pageinfo">
              Página <b>{hPage}</b> / <b>{hPages}</b>
            </div>

            <button
              className="att-btn att-btn-ghost"
              onClick={() => loadHistory(Math.min(hPages, hPage + 1), true)}
              disabled={busyList || hPage >= hPages}
            >
              <span>Siguiente</span> →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
