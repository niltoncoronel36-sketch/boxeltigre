import { useMemo } from "react";
import {
  CreditCard,
  Wallet,
  CircleDollarSign,
  TrendingUp,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  BadgeCheck,
} from "lucide-react";
import { useStudentPayments } from "./hooks/useStudentPayments";

function money(n: any) {
  const v = Number(n ?? 0);
  return `S/ ${v.toFixed(2)}`;
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  if (String(d).includes("-") && String(d).length >= 10) {
    const [y, m, day] = String(d).slice(0, 10).split("-");
    return `${day}/${m}/${y}`;
  }
  const dt = new Date(String(d));
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString();
}

function isOverdue(due?: string | null, status?: string) {
  if (!due) return false;
  if (status === "paid") return false;
  const dt = new Date(`${due}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt < today;
}

function statusMeta(c: any) {
  const st = String(c?.status ?? "");
  if (st === "paid" || c?.paid_at) {
    return { text: "Pagado", tone: "ok" as const, Icon: CheckCircle2 };
  }
  if (st === "partial") {
    return { text: "Parcial", tone: "warn" as const, Icon: BadgeCheck };
  }
  if (isOverdue(c?.due_date, st)) {
    return { text: "Vencido", tone: "danger" as const, Icon: AlertTriangle };
  }
  return { text: "Pendiente", tone: "neutral" as const, Icon: Clock3 };
}

function badgeStyle(tone: "ok" | "warn" | "danger" | "neutral") {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: "1px solid rgba(0,0,0,.10)",
    whiteSpace: "nowrap",
  };

  if (tone === "ok") return { ...base, background: "rgba(0,200,0,.10)", color: "rgba(0,0,0,.82)" };
  if (tone === "warn") return { ...base, background: "rgba(255,200,0,.18)", color: "rgba(0,0,0,.86)" };
  if (tone === "danger") return { ...base, background: "rgba(255,0,0,.12)", color: "rgba(0,0,0,.86)" };
  return { ...base, background: "rgba(0,0,0,.05)", color: "rgba(0,0,0,.75)" };
}

export default function StudentPayments() {
  const { data, loading } = useStudentPayments();

  const computed = useMemo(() => {
    if (!data) return null;

    const total = Number(data.total ?? 0);
    const paid = Number(data.paid ?? 0);
    const pending = Number(data.pending ?? 0);
    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

    const list = Array.isArray(data.installments) ? data.installments : [];

    const nextPending = list
      .filter((c: any) => String(c?.status ?? "") !== "paid" && !c?.paid_at)
      .sort((a: any, b: any) => String(a?.due_date ?? "").localeCompare(String(b?.due_date ?? "")))[0];

    const overdueCount = list.filter((c: any) => isOverdue(c?.due_date, String(c?.status ?? ""))).length;

    return { total, paid, pending, pct, nextPending, overdueCount, list };
  }, [data]);

  if (loading) return <div className="card">Cargando pagos…</div>;
  if (!data || !computed) return <div className="card">No tienes pagos registrados.</div>;

  const { total, paid, pending, pct, nextPending, overdueCount, list } = computed;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <CreditCard size={22} />
        <h2 style={{ fontWeight: 900, margin: 0 }}>Mis pagos</h2>

        <div style={{ color: "rgba(0,0,0,.55)", fontSize: 13 }}>
          {data.plan?.name ? (
            <>
              Plan: <b style={{ color: "rgba(0,0,0,.80)" }}>{data.plan.name}</b>
              {data.plan.level ? (
                <>
                  {" "}• Nivel: <b style={{ color: "rgba(0,0,0,.80)" }}>{data.plan.level}</b>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {/* ===== RESUMEN ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CircleDollarSign size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>TOTAL</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{money(total)}</div>
          <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", marginTop: 6 }}>
            {list.length} cuota(s)
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wallet size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>PAGADO</div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{money(paid)}</div>

          {/* Barra progreso */}
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(0,0,0,.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  background: "rgba(255,106,0,.75)",
                }}
              />
            </div>

            <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,.55)" }}>
              <TrendingUp size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              Progreso: <b style={{ color: "rgba(0,0,0,.80)" }}>{pct}%</b>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarClock size={16} />
            <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>PENDIENTE</div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{money(pending)}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {overdueCount > 0 ? (
              <span style={badgeStyle("danger")}>
                <AlertTriangle size={14} />
                {overdueCount} vencida(s)
              </span>
            ) : (
              <span style={badgeStyle("ok")}>
                <CheckCircle2 size={14} />
                Al día
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRÓXIMA CUOTA ===== */}
      {nextPending ? (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={16} />
                Próxima cuota
              </div>

              <div style={{ marginTop: 6, color: "rgba(0,0,0,.65)", fontSize: 13 }}>
                Cuota <b>#{nextPending.number}</b> • Vence: <b>{fmtDate(nextPending.due_date)}</b>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)", fontWeight: 900 }}>MONTO</div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>{money(nextPending.amount)}</div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            {(() => {
              const meta = statusMeta(nextPending);
              const Icon = meta.Icon;
              const tone = isOverdue(nextPending.due_date, nextPending.status) ? "danger" : meta.tone;
              return (
                <span style={badgeStyle(tone)}>
                  <Icon size={14} />
                  {meta.text}
                </span>
              );
            })()}
          </div>
        </div>
      ) : null}

      {/* ===== TABLA ===== */}
      <div className="card" style={{ marginTop: 14, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Cuota", "Monto", "Vence", "Pagado", "Estado"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 10px",
                    borderBottom: "1px solid rgba(0,0,0,.08)",
                    color: "rgba(0,0,0,.70)",
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: 0.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {list.map((c: any) => {
              const meta = statusMeta(c);
              const Icon = meta.Icon;
              const tone = isOverdue(c?.due_date, c?.status) ? "danger" : meta.tone;

              return (
                <tr key={c.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)", fontWeight: 900 }}>
                    #{c.number}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                    <b>{money(c.amount)}</b>
                    {typeof c.paid === "number" && c.paid > 0 && c.paid < c.amount ? (
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,.55)" }}>
                        Pagado: <b>{money(c.paid)}</b>
                      </div>
                    ) : null}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                    {fmtDate(c.due_date)}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                    {c.paid_at ? fmtDate(c.paid_at) : "—"}
                  </td>

                  <td style={{ padding: 10, borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                    <span style={badgeStyle(tone)}>
                      <Icon size={14} />
                      {meta.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,.55)", display: "flex", gap: 8, alignItems: "center" }}>
          <BadgeCheck size={14} />
          Tip: si tienes una cuota <b>Vencida</b>, coordina con administración para regularizarla.
        </div>
      </div>
    </div>
  );
}
