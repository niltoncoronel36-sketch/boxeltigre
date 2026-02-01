import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  ChevronUp,
  Save,
  Info,
  Lock,
  Calculator,
  CheckCircle,
  FileText,
  Printer,
  X,
} from "lucide-react";

import type { Enrollment, Charge, PaymentMethod } from "../../../services/enrollments";
import { listInstallments, payInstallment, saveEnrollmentCredit } from "../../../services/enrollments";
import { getApiErrorMessage } from "../../../services/api";

import { buildCreditSchedule } from "../utils/creditSchedule";
import { todayYmd, toYmd } from "../utils/dates";
import { clamp } from "../utils/helpers";
import { moneyPENFromCents } from "../utils/money";

// ✅ DATA EMPRESA (igual que matrícula). Edita a tu gusto.
const BUSINESS = {
  name: "Club de Box El Tigre",
  ruc: "", // opcional
  phone: "+51 999 999 999",
  address: "Jr. Ancash 415, Huancayo 12001",
  city: "Huancayo - Perú",
  terms: [
    "Conserve este comprobante.",
    "Pagos no reembolsables salvo error de sistema.",
    "Si requiere factura, solicitar antes del pago.",
    "La cuota corresponde al plan/categoría registrada.",
  ],
};

type CreditForm = {
  total_soles: string;
  pay_day_date: string;
  cuotas: number;
};

function safeYmdWithDay(day: number) {
  const base = todayYmd(); // YYYY-MM-DD
  const y = base.slice(0, 4);
  const m = base.slice(5, 7);
  const safeDay = clamp(Number(day) || 5, 1, 28);
  return `${y}-${m}-${String(safeDay).padStart(2, "0")}`;
}

function methodLabel(m?: PaymentMethod | null) {
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  if (m === "yape") return "Yape";
  if (m === "plin") return "Plin";
  if (m === "transfer") return "Transferencia";
  return "—";
}

function pad(n: number, len = 6) {
  return String(n).padStart(len, "0");
}

function formatDateTimeExact(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function fmtYmd(v: any) {
  if (!v) return "—";
  const s = String(v);
  if (s.includes("T")) return s.slice(0, 10);
  if (s.includes(" ")) return s.slice(0, 10);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function esc(v: any) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabelLocal(enrollment: Enrollment) {
  const cat: any = (enrollment as any).category ?? null;
  const name =
    cat?.name ??
    cat?.nombre ??
    (enrollment as any).category_name ??
    (enrollment as any).category?.name ??
    (enrollment as any).category?.nombre ??
    null;

  const level = cat?.level ?? cat?.nivel ?? (enrollment as any).category_level ?? null;

  if (name && level) return `${name} (${level})`;
  if (name) return String(name);

  const id = (enrollment as any).category_id ?? null;
  return id ? `Categoría #${id}` : "—";
}

function printHtml(title: string, html: string) {
  const w = window.open("", "_blank", "width=900,height=900");
  if (!w) return;

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111827}
  .paper{max-width:760px;margin:0 auto;border:1px solid #e5e7eb;border-radius:14px;padding:18px}
  .row{display:flex;justify-content:space-between;gap:12px}
  .muted{color:#6b7280;font-size:12px}
  .title{font-size:18px;font-weight:900;margin:0}
  .tag{display:inline-block;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:900;background:#111827;color:#fff}
  .hr{height:1px;background:#e5e7eb;margin:14px 0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .box{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
  .k{font-size:11px;font-weight:900;color:#6b7280;letter-spacing:.4px;text-transform:uppercase}
  .v{font-size:13px;font-weight:800;color:#111827;margin-top:6px}
  .total{font-size:22px;font-weight:900}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{padding:10px;border-bottom:1px solid #e5e7eb;text-align:left}
  th{font-size:10px;color:#6b7280;font-weight:900;letter-spacing:.4px;text-transform:uppercase}
  @media print{ body{margin:0} .paper{border:none;border-radius:0} }
</style>
</head>
<body>
${html}
<script>
  window.focus();
  window.print();
  window.onafterprint = () => window.close();
</script>
</body>
</html>`);
  w.document.close();
}

function InstallmentReceiptModal(props: {
  open: boolean;
  onClose: () => void;
  charge: Charge | null;
  enrollment: Enrollment;
  installmentNumber: number | null;
  monthlyFeeCents: number;
}) {
  const { open, onClose, charge, enrollment, installmentNumber, monthlyFeeCents } = props;
  if (!open || !charge) return null;

  const receiptNo = `NV-CUOTA-${pad(charge.id)}`;

  const studentName =
    enrollment.student
      ? `${enrollment.student.first_name} ${enrollment.student.last_name}`.trim()
      : `Alumno #${enrollment.student_id}`;

  const category = categoryLabelLocal(enrollment);
  const paidAtExact = formatDateTimeExact((charge as any).updated_at);

  function doPrint() {
    const html = `
      <div class="paper">
        <div class="row">
          <div>
            <p class="title">NOTA DE VENTA — CUOTA</p>
            <div class="muted">Comprobante de pago</div>

            <div class="muted" style="margin-top:8px;">
              <b>${esc(BUSINESS.name)}</b><br/>
              ${esc(BUSINESS.address)}<br/>
              ${esc(BUSINESS.city)}<br/>
              Tel: ${esc(BUSINESS.phone)}
              ${BUSINESS.ruc ? `<br/>RUC: ${esc(BUSINESS.ruc)}` : ``}
            </div>

            <div class="muted" style="margin-top:10px;">Pago exacto: <b>${esc(paidAtExact)}</b></div>
          </div>
          <div style="text-align:right;">
            <div class="tag">${esc(receiptNo)}</div>
            <div class="muted" style="margin-top:8px;">Estado: PAGADO</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="grid">
          <div class="box">
            <div class="k">Alumno</div>
            <div class="v">${esc(studentName)}</div>
            <div class="muted" style="margin-top:6px;">Matrícula ID: ${esc(enrollment.id)}</div>
            <div class="muted" style="margin-top:6px;">Categoría: ${esc(category)}</div>
          </div>

          <div class="box">
            <div class="k">Detalle</div>
            <div class="v">Cuota #${esc(installmentNumber ?? "—")}</div>
            <div class="muted" style="margin-top:6px;">Vence: ${esc(fmtYmd(charge.due_on))}</div>
            <div class="muted" style="margin-top:6px;">Mensualidad ref.: ${esc(moneyPENFromCents(monthlyFeeCents))}</div>
          </div>

          <div class="box">
            <div class="k">Método</div>
            <div class="v">${esc(methodLabel((charge as any).method))}</div>
            <div class="muted" style="margin-top:6px;">Fecha (paid_on): ${esc(fmtYmd((charge as any).paid_on) ?? "—")}</div>
          </div>

          <div class="box">
            <div class="k">Monto</div>
            <div class="v total">${esc(moneyPENFromCents(charge.amount_cents))}</div>
            <div class="muted" style="margin-top:6px;">Moneda: PEN</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="muted">
          * Registro con fecha y hora exacta para control interno.
        </div>

        <div class="muted" style="margin-top:10px;">
          <b>Términos y condiciones</b><br/>
          ${BUSINESS.terms.map((t) => `• ${esc(t)}`).join("<br/>")}
        </div>
      </div>
    `;

    printHtml(`Nota de venta ${receiptNo}`, html);
  }

  return (
    <div style={receiptOverlay} onMouseDown={onClose}>
      <div style={receiptCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Nota de venta — Cuota</div>
          <button style={receiptCloseBtn} onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div style={receiptBody}>
          {/* ✅ Empresa (igual que matrícula) */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: "#111827" }}>{BUSINESS.name}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{BUSINESS.address}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>{BUSINESS.city}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>
              Tel: <b style={{ color: "#111827" }}>{BUSINESS.phone}</b>
              {BUSINESS.ruc ? (
                <>
                  {" "}
                  • RUC: <b style={{ color: "#111827" }}>{BUSINESS.ruc}</b>
                </>
              ) : null}
            </div>
          </div>

          <div style={receiptHeaderRow}>
            <div>
              <div style={receiptK}>N°</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{receiptNo}</div>
              <div style={receiptM}>
                Pago exacto: <b>{paidAtExact}</b>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={receiptK}>Total</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{moneyPENFromCents(charge.amount_cents)}</div>
            </div>
          </div>

          <div style={receiptGrid}>
            <div style={receiptBox}>
              <div style={receiptK}>Alumno</div>
              <div style={receiptV}>{studentName}</div>
              <div style={receiptM}>Matrícula ID: {enrollment.id}</div>
              <div style={receiptM}>Categoría: {category}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Detalle</div>
              <div style={receiptV}>Cuota #{installmentNumber ?? "—"}</div>
              <div style={receiptM}>Vence: {fmtYmd(charge.due_on)}</div>
              <div style={receiptM}>Mensualidad ref.: {moneyPENFromCents(monthlyFeeCents)}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Método</div>
              <div style={receiptV}>{methodLabel((charge as any).method)}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Fecha</div>
              <div style={receiptV}>{fmtYmd((charge as any).paid_on) ?? "—"}</div>
              <div style={receiptM}>Hora exacta: {paidAtExact}</div>
            </div>

            {/* ✅ Términos (igual que impresión) */}
            <div style={{ ...receiptBox, gridColumn: "1 / -1" }}>
              <div style={receiptK}>Términos y condiciones</div>
              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                {BUSINESS.terms.map((t, i) => (
                  <div key={i} style={receiptM}>
                    • {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={receiptFootNote}>
            * Comprobante interno con fecha/hora exacta (seguridad).
          </div>
        </div>

        <div style={receiptActions}>
          <button style={receiptBtnPrimary} onClick={doPrint} type="button">
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
          <button style={receiptBtnSecondary} onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreditPanel(props: {
  enrollment: Enrollment;
  monthlyFeeCents: number;
  enabled: boolean;
  loading: boolean;
  setLoading: (v: boolean) => void;
  setErr: (v: string | null) => void;
  onRefresh: () => Promise<void>;
}) {
  const { enrollment, monthlyFeeCents, enabled, loading, setLoading, setErr, onRefresh } = props;

  const [open, setOpen] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [installments, setInstallments] = useState<Charge[] | null>(null);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptCharge, setReceiptCharge] = useState<Charge | null>(null);
  const [receiptIdx, setReceiptIdx] = useState<number | null>(null);

  const [creditForm, setCreditForm] = useState<CreditForm>({
    total_soles: "",
    pay_day_date: "",
    cuotas: 3,
  });

  const planTotalCents = Number((enrollment as any).plan_total_cents ?? 0) || 0;
  const planCuotas = Number((enrollment as any).installments_count ?? 0) || 0;
  const planBillingDay = Number((enrollment as any).billing_day ?? 0) || 0;
  const hasPlan = planTotalCents > 0;

  async function refreshInstallments() {
    if (!enabled || !hasPlan) return;

    setInstallmentsLoading(true);
    try {
      const data = await listInstallments(enrollment.id);
      const sorted = [...data].sort((a, b) => String(a.due_on).localeCompare(String(b.due_on)));
      setInstallments(sorted);
    } catch {
      setInstallments(null);
    } finally {
      setInstallmentsLoading(false);
    }
  }

  useEffect(() => {
    if (!enabled || !hasPlan) return;
    if (open) return;
    refreshInstallments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasPlan, open, enrollment.id, planTotalCents, planCuotas, planBillingDay]);

  const creditPayDay = useMemo(() => {
    if (creditForm.pay_day_date) return Number(creditForm.pay_day_date.slice(8, 10)) || 5;
    if (planBillingDay) return planBillingDay;
    return 5;
  }, [creditForm.pay_day_date, planBillingDay]);

  const suggested = useMemo(() => {
    const s = toYmd((enrollment as any).starts_on) || todayYmd();
    const m = (enrollment as any).ends_on
      ? (() => {
          const ss = new Date(s + "T00:00:00");
          const ee = new Date(toYmd((enrollment as any).ends_on) + "T00:00:00");
          const months = (ee.getFullYear() - ss.getFullYear()) * 12 + (ee.getMonth() - ss.getMonth()) + 1;
          return Math.max(1, months);
        })()
      : 3;

    return { totalCents: monthlyFeeCents * m, cuotas: m, startYmd: s };
  }, [(enrollment as any).starts_on, (enrollment as any).ends_on, monthlyFeeCents]);

  const totalCents = Math.round((Number(creditForm.total_soles || "0") || 0) * 100);
  const cuotas = clamp(Number(creditForm.cuotas) || 1, 1, 36);

  const schedulePreview = useMemo(() => {
    if (!open) return [];
    if (totalCents <= 0) return [];
    return buildCreditSchedule(suggested.startYmd, creditPayDay, cuotas, totalCents);
  }, [open, totalCents, creditPayDay, cuotas, suggested.startYmd]);

  const cuotaCentsPreview = schedulePreview.length ? schedulePreview[0].amount_cents : 0;

  const schedulePlanFallback = useMemo(() => {
    if (!hasPlan) return [];
    const startYmd = toYmd((enrollment as any).starts_on) || todayYmd();
    const billing = planBillingDay || 5;
    const n = clamp(planCuotas || 1, 1, 36);
    return buildCreditSchedule(startYmd, billing, n, planTotalCents) as Array<{
      idx: number;
      due_on: string;
      amount_cents: number;
    }>;
  }, [hasPlan, planTotalCents, planCuotas, planBillingDay, (enrollment as any).starts_on]);

  const rows = useMemo(() => {
    if (installments && installments.length) {
      return installments.map((c, i) => ({
        key: c.id,
        idx: i + 1,
        charge: c,
        due_on: c.due_on,
        amount_cents: c.amount_cents,
        paid_cents: c.paid_cents,
        status: c.status,
        method: (c as any).method as PaymentMethod | null | undefined,
        paid_on: (c as any).paid_on as string | null | undefined,
        updated_at: (c as any).updated_at as string | undefined,
      }));
    }
    return schedulePlanFallback.map((r) => ({
      key: `fallback-${r.idx}`,
      idx: r.idx,
      charge: null as any,
      due_on: r.due_on,
      amount_cents: r.amount_cents,
      paid_cents: 0,
      status: "unpaid" as any,
      method: null,
      paid_on: null,
      updated_at: undefined,
    }));
  }, [installments, schedulePlanFallback]);

  const paidCount = useMemo(() => rows.reduce((acc, r) => acc + (r.status === "paid" ? 1 : 0), 0), [rows]);
  const pendingCount = useMemo(() => Math.max(0, rows.length - paidCount), [rows.length, paidCount]);

  function openEditor() {
    setSavedOk(false);
    setOpen(true);

    setCreditForm((f) => {
      const total = f.total_soles ? f.total_soles : (hasPlan ? planTotalCents : suggested.totalCents) / 100;
      const cuotasNext = f.cuotas ? f.cuotas : (hasPlan ? planCuotas : suggested.cuotas) || 3;

      const payDate = f.pay_day_date
        ? f.pay_day_date
        : planBillingDay
        ? safeYmdWithDay(planBillingDay)
        : todayYmd();

      return {
        total_soles: String(total).includes(".") ? String(total) : Number(total).toFixed(2),
        cuotas: cuotasNext,
        pay_day_date: payDate,
      };
    });
  }

  function closeEditor() {
    setOpen(false);
    setSavedOk(false);
  }

  async function handlePayCharge(charge: Charge, idx: number) {
    try {
      setErr(null);
      setLoading(true);

      const updated = await payInstallment(charge.id, {
        method: payMethod,
        paid_on: todayYmd(),
      });

      await refreshInstallments();

      setReceiptCharge(updated ?? charge);
      setReceiptIdx(idx);
      setReceiptOpen(true);
    } catch (e: any) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function openReceiptForPaid(charge: Charge, idx: number) {
    setReceiptCharge(charge);
    setReceiptIdx(idx);
    setReceiptOpen(true);
  }

  function downloadHistoryPdf() {
    if (!installments || !installments.length) return;

    const paid = installments
      .map((c, i) => ({ c, idx: i + 1 }))
      .filter((x) => x.c.status === "paid" || x.c.status === "partial");

    const studentName =
      enrollment.student
        ? `${enrollment.student.first_name} ${enrollment.student.last_name}`.trim()
        : `Alumno #${enrollment.student_id}`;

    const category = categoryLabelLocal(enrollment);

    const html = `
      <div class="paper">
        <div class="row">
          <div>
            <p class="title">HISTORIAL DE PAGOS — CUOTAS</p>
            <div class="muted">${esc(BUSINESS.name)} • ${esc(BUSINESS.phone)}</div>
            <div class="muted">Alumno: <b>${esc(studentName)}</b></div>
            <div class="muted">Matrícula ID: ${esc(enrollment.id)} • ${esc(category)}</div>
          </div>
          <div style="text-align:right;">
            <div class="tag">EXPORT</div>
            <div class="muted" style="margin-top:8px;">Generado: ${esc(formatDateTimeExact(new Date().toISOString()))}</div>
          </div>
        </div>

        <div class="hr"></div>

        <table>
          <thead>
            <tr>
              <th>Cuota</th>
              <th>Vence</th>
              <th>Método</th>
              <th>paid_on</th>
              <th>Hora exacta (updated_at)</th>
              <th style="text-align:right;">Monto</th>
              <th style="text-align:right;">Pagado</th>
              <th>Estado</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            ${
              paid.length
                ? paid
                    .map(
                      ({ c, idx }) => `
                  <tr>
                    <td>#${idx}</td>
                    <td>${esc(fmtYmd(c.due_on))}</td>
                    <td>${esc(methodLabel((c as any).method))}</td>
                    <td>${esc(fmtYmd((c as any).paid_on) ?? "—")}</td>
                    <td>${esc(formatDateTimeExact((c as any).updated_at))}</td>
                    <td style="text-align:right;">${esc(moneyPENFromCents(c.amount_cents))}</td>
                    <td style="text-align:right;">${esc(moneyPENFromCents(c.paid_cents))}</td>
                    <td>${esc(c.status)}</td>
                    <td>NV-CUOTA-${pad(c.id)}</td>
                  </tr>
                `
                    )
                    .join("")
                : `<tr><td colspan="9" class="muted">No hay pagos registrados.</td></tr>`
            }
          </tbody>
        </table>

        <div class="hr"></div>
        <div class="muted">
          * Incluye fecha/hora exacta del comprobante (updated_at) por seguridad.
        </div>
      </div>
    `;

    printHtml(`Historial pagos matricula ${enrollment.id}`, html);
  }

  return (
    <>
      <InstallmentReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        charge={receiptCharge}
        enrollment={enrollment}
        installmentNumber={receiptIdx}
        monthlyFeeCents={monthlyFeeCents}
      />

      <div style={containerStyle}>
        <div style={headerSection}>
          <div style={titleGroup}>
            <Calculator size={16} color="#ff5722" />
            <span style={titleText}>PLAN DE CUOTAS</span>
          </div>
          {hasPlan && !open && <span style={activeBadge}>PROGRAMADO</span>}
        </div>

        {!enabled ? (
          <div style={lockedState}>
            <Lock size={14} />
            <span>Habilite el pago inicial para programar crédito</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {hasPlan && !open && (
              <>
                <div style={summaryCard}>
                  <div style={summaryItem}>
                    <span style={summaryLabel}>CRÉDITO TOTAL</span>
                    <span style={summaryValue}>{moneyPENFromCents(planTotalCents)}</span>
                  </div>
                  <div style={summaryDivider} />
                  <div style={summaryItem}>
                    <span style={summaryLabel}>CUOTAS</span>
                    <span style={summaryValue}>
                      {planCuotas || "—"}{" "}
                      {planCuotas ? `de ${moneyPENFromCents(planTotalCents / Math.max(1, planCuotas))}` : ""}
                    </span>
                  </div>
                </div>

                <div style={payStatsRow}>
                  <div style={payStatBox}>
                    <span style={payStatLabel}>PAGADAS</span>
                    <span style={payStatValueGreen}>{paidCount}</span>
                  </div>
                  <div style={payStatBox}>
                    <span style={payStatLabel}>PENDIENTES</span>
                    <span style={payStatValueOrange}>{pendingCount}</span>
                  </div>
                  <div style={payStatBox}>
                    <span style={payStatLabel}>DÍA COBRO</span>
                    <span style={payStatValueDark}>{planBillingDay || 5}</span>
                  </div>
                </div>

                <div style={methodRow}>
                  <span style={methodLabelStyle}>Método para pagar cuotas:</span>
                  <select style={methodSelect} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div style={installmentsCard}>
                  <div style={installmentsHeader}>
                    <Info size={14} />
                    <span style={{ fontWeight: 900, fontSize: 11, color: "#475569" }}>CUOTAS PROGRAMADAS (PAGAR)</span>

                    <button
                      type="button"
                      style={historyBtn}
                      onClick={downloadHistoryPdf}
                      disabled={!installments || !installments.length}
                      title={!installments ? "Aún no hay cuotas reales en backend" : "Imprimir/Guardar PDF"}
                    >
                      <Printer size={14} /> Historial (PDF)
                    </button>

                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>
                      {installmentsLoading ? "Cargando..." : ""}
                    </span>
                  </div>

                  <div style={installmentsBody}>
                    {rows.map((row) => {
                      const paid = row.status === "paid";
                      const partial = row.status === "partial";
                      const remaining = Math.max(0, row.amount_cents - (row.paid_cents || 0));

                      return (
                        <div key={row.key} style={installmentRow}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={installmentTop}>
                              <span style={installmentIdx}>#{row.idx}</span>
                              <span style={installmentDue}>{fmtYmd(row.due_on)}</span>
                            </div>

                            <div style={installmentAmount}>{moneyPENFromCents(row.amount_cents)}</div>

                            {partial ? (
                              <div style={partialNote}>
                                Parcial: {moneyPENFromCents(row.paid_cents)} • Falta: <b>{moneyPENFromCents(remaining)}</b>
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {paid && row.charge ? (
                              <>
                                <div style={paidPill}>
                                  <CheckCircle size={14} />
                                  Pagada
                                </div>
                                <button
                                  type="button"
                                  style={receiptMiniBtn}
                                  onClick={() => openReceiptForPaid(row.charge, row.idx)}
                                  title="Ver / imprimir nota de venta"
                                >
                                  <FileText size={14} />
                                </button>
                              </>
                            ) : row.charge ? (
                              <button style={payBtn} type="button" disabled={loading} onClick={() => handlePayCharge(row.charge, row.idx)}>
                                PAGAR CUOTA
                              </button>
                            ) : (
                              <div style={noBackendPill} title="Aún no hay cuotas reales en backend">
                                Sin backend
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              style={open ? toggleBtnActive : toggleBtn}
              onClick={() => {
                if (open) return closeEditor();
                openEditor();
              }}
            >
              {open ? <ChevronUp size={16} /> : <CreditCard size={16} />}
              {open ? "CANCELAR EDICIÓN" : hasPlan ? "RE-PROGRAMAR CUOTAS" : "CONFIGURAR CRÉDITO"}
            </button>

            {open && (
              <div style={editorPanel}>
                <div style={formGrid}>
                  <div style={inputWrapper}>
                    <label style={labelStyle}>MONTO TOTAL (S/)</label>
                    <input
                      style={modernInput}
                      value={creditForm.total_soles}
                      onChange={(e) => setCreditForm((f) => ({ ...f, total_soles: e.target.value.replace(/[^\d.]/g, "") }))}
                      inputMode="decimal"
                      placeholder="Ej: 600.00"
                    />
                  </div>

                  <div style={inputWrapper}>
                    <label style={labelStyle}>N° CUOTAS</label>
                    <input
                      style={modernInput}
                      value={creditForm.cuotas}
                      onChange={(e) =>
                        setCreditForm((f) => ({ ...f, cuotas: Number(e.target.value.replace(/[^\d]/g, "")) || 1 }))
                      }
                      inputMode="numeric"
                    />
                  </div>

                  <div style={{ ...inputWrapper, gridColumn: "span 2" }}>
                    <label style={labelStyle}>PRIMER VENCIMIENTO (DETERMINA EL DÍA DE PAGO)</label>
                    <div style={{ position: "relative" }}>
                      <input
                        style={{ ...modernInput, width: "100%", paddingLeft: "35px", paddingRight: "16px" }}
                        type="date"
                        value={creditForm.pay_day_date}
                        onChange={(e) => setCreditForm((f) => ({ ...f, pay_day_date: e.target.value }))}
                      />
                      <CalendarDays size={14} style={inputIcon} />
                    </div>
                  </div>
                </div>

                <div style={previewBox}>
                  <div style={previewHeader}>
                    <Info size={14} />
                    <span>
                      Vista previa: {cuotas} cuotas de <b>{moneyPENFromCents(cuotaCentsPreview)}</b>{" "}
                      <span style={{ opacity: 0.7 }}>
                        • Día cobro: <b>{creditPayDay}</b>
                      </span>
                    </span>
                  </div>

                  <div style={tableContainer}>
                    {schedulePreview.length === 0 ? (
                      <div style={{ padding: 12, fontSize: 12, color: "#64748b" }}>
                        Ingresa un monto mayor a 0 para ver el cronograma.
                      </div>
                    ) : (
                      <table style={miniTable}>
                        <thead>
                          <tr>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>VENCIMIENTO</th>
                            <th style={{ ...thStyle, textAlign: "right" }}>MONTO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedulePreview.map((row) => (
                            <tr key={row.idx}>
                              <td style={tdStyle}>{row.idx}</td>
                              <td style={tdStyle}>{row.due_on}</td>
                              <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>
                                {moneyPENFromCents(row.amount_cents)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {savedOk ? (
                  <div style={savedOkStyle}>
                    <CheckCircle size={16} /> Programación guardada
                  </div>
                ) : null}

                <button
                  style={saveBtn}
                  disabled={totalCents <= 0 || loading}
                  onClick={async () => {
                    try {
                      setErr(null);
                      setSavedOk(false);
                      setLoading(true);

                      await saveEnrollmentCredit(enrollment.id, {
                        plan_total_cents: totalCents,
                        installments_count: cuotas,
                        billing_day: creditPayDay,
                      });

                      await onRefresh();
                      setSavedOk(true);

                      await refreshInstallments();
                      setTimeout(() => setOpen(false), 600);
                    } catch (e: any) {
                      setErr(getApiErrorMessage(e));
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    "PROCESANDO..."
                  ) : (
                    <>
                      <Save size={16} /> GUARDAR PROGRAMACIÓN
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * ⚠️ NOTA:
 * Tu archivo real ya tiene todas estas constantes de estilos:
 * containerStyle, headerSection, titleGroup, titleText, activeBadge, lockedState,
 * summaryCard, summaryItem, summaryLabel, summaryValue, summaryDivider,
 * payStatsRow, payStatBox, payStatLabel, payStatValueGreen, payStatValueOrange, payStatValueDark,
 * methodRow, methodLabelStyle, methodSelect,
 * installmentsCard, installmentsHeader, historyBtn, installmentsBody, installmentRow, installmentTop,
 * installmentIdx, installmentDue, installmentAmount, partialNote, paidPill, receiptMiniBtn, payBtn, noBackendPill,
 * toggleBtn, toggleBtnActive, editorPanel, formGrid, inputWrapper, labelStyle, modernInput, inputIcon,
 * previewBox, previewHeader, tableContainer, miniTable, thStyle, tdStyle, savedOkStyle, saveBtn,
 * receiptOverlay, receiptCard, receiptCloseBtn, receiptBody, receiptHeaderRow, receiptGrid, receiptBox,
 * receiptK, receiptV, receiptM, receiptFootNote, receiptActions, receiptBtnPrimary, receiptBtnSecondary
 *
 * No los toqué aquí. Déjalos igual al final de tu archivo.
 */





// =========================
// ✅ ESTILOS CreditPanel + Nota de venta (Cuota)
// Pega esto AL FINAL de tu CreditPanel.tsx
// (Asegúrate de NO tenerlos duplicados arriba.)
// =========================

const containerStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(255,255,255,.92)",
  boxShadow: "0 14px 40px rgba(0,0,0,.06)",
  padding: 14,
};

const headerSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const titleGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const titleText: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.8,
  color: "rgba(2,6,23,.80)",
};

const activeBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 0.4,
  border: "1px solid rgba(74,222,128,.24)",
  background: "rgba(74,222,128,.10)",
  color: "rgba(2,6,23,.85)",
};

const lockedState: React.CSSProperties = {
  borderRadius: 16,
  border: "1px dashed rgba(0,0,0,.18)",
  background: "rgba(2,6,23,.02)",
  padding: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "rgba(2,6,23,.65)",
  fontWeight: 900,
  fontSize: 12,
};

const summaryCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.80))",
  padding: 12,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 12,
};

const summaryItem: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const summaryLabel: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.55)",
};

const summaryValue: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 14,
  color: "rgba(2,6,23,.88)",
};

const summaryDivider: React.CSSProperties = {
  width: 1,
  height: 42,
  background: "rgba(0,0,0,.10)",
  borderRadius: 999,
};

const payStatsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
};

const payStatBox: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(255,255,255,.85)",
  padding: 12,
  display: "grid",
  gap: 6,
};

const payStatLabel: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.55)",
};

const payStatValueGreen: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
  color: "rgba(22,163,74,.95)",
};

const payStatValueOrange: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
  color: "rgba(234,88,12,.95)",
};

const payStatValueDark: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
  color: "rgba(2,6,23,.90)",
};

const methodRow: React.CSSProperties = {
  marginTop: 2,
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const methodLabelStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.65)",
};

const methodSelect: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.86)",
  outline: "none",
};

const installmentsCard: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(255,255,255,.92)",
  overflow: "hidden",
};

const installmentsHeader: React.CSSProperties = {
  padding: "12px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(0,0,0,.06)",
  background: "rgba(2,6,23,.02)",
};

const historyBtn: React.CSSProperties = {
  marginLeft: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.85)",
  cursor: "pointer",
};

const installmentsBody: React.CSSProperties = {
  padding: 12,
  display: "grid",
  gap: 10,
};

const installmentRow: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(255,255,255,.95)",
  padding: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const installmentTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const installmentIdx: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 26,
  borderRadius: 10,
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(2,6,23,.03)",
  color: "rgba(2,6,23,.85)",
};

const installmentDue: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.70)",
};

const installmentAmount: React.CSSProperties = {
  marginTop: 6,
  fontWeight: 900,
  fontSize: 16,
  color: "rgba(2,6,23,.92)",
};

const partialNote: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(234,88,12,.95)",
};

const paidPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(74,222,128,.22)",
  background: "rgba(74,222,128,.10)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.85)",
};

const receiptMiniBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const payBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,122,24,.25)",
  background: "linear-gradient(135deg, rgba(255,122,24,1), rgba(255,190,64,.95))",
  color: "#111827",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(255,122,24,.18)",
};

const noBackendPill: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px dashed rgba(0,0,0,.18)",
  background: "rgba(2,6,23,.02)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.55)",
};

const toggleBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(2,6,23,.04)",
  color: "rgba(2,6,23,.86)",
  fontWeight: 900,
  cursor: "pointer",
};

const toggleBtnActive: React.CSSProperties = {
  ...toggleBtn,
  background: "rgba(255,122,24,.10)",
  border: "1px solid rgba(255,122,24,.18)",
};

const editorPanel: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(255,255,255,.92)",
  padding: 14,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const inputWrapper: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.60)",
};

const modernInput: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.86)",
  outline: "none",
};

const inputIcon: React.CSSProperties = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  opacity: 0.7,
};

const previewBox: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(2,6,23,.02)",
  overflow: "hidden",
};

const previewHeader: React.CSSProperties = {
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(0,0,0,.06)",
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(2,6,23,.70)",
};

const tableContainer: React.CSSProperties = {
  padding: 10,
  overflowX: "auto",
};

const miniTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
  background: "rgba(255,255,255,.92)",
  borderRadius: 14,
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  padding: 10,
  textAlign: "left",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.55)",
  borderBottom: "1px solid rgba(0,0,0,.08)",
  background: "rgba(2,6,23,.02)",
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  borderBottom: "1px solid rgba(0,0,0,.06)",
  fontWeight: 800,
  color: "rgba(2,6,23,.82)",
};

const savedOkStyle: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid rgba(74,222,128,.24)",
  background: "rgba(74,222,128,.10)",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontWeight: 900,
  color: "rgba(2,6,23,.86)",
};

const saveBtn: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(59,130,246,.22)",
  background: "linear-gradient(135deg, rgba(59,130,246,1), rgba(147,197,253,.95))",
  color: "#0b1220",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(59,130,246,.15)",
};

// =========================
// ✅ Modal Nota de venta — Cuota (mismos estilos pro)
// =========================
const receiptOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, .65)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  zIndex: 80,
};

const receiptCard: React.CSSProperties = {
  width: "min(780px, 96vw)",
  borderRadius: 22,
  background: "rgba(255,255,255,.95)",
  border: "1px solid rgba(0,0,0,.08)",
  boxShadow: "0 20px 80px rgba(0,0,0,.30)",
  padding: 14,
};

const receiptCloseBtn: React.CSSProperties = {
  marginLeft: "auto",
  width: 38,
  height: 38,
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(2,6,23,.04)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const receiptBody: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.86)",
  padding: 14,
};

const receiptHeaderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 10,
  borderBottom: "1px dashed rgba(0,0,0,.12)",
};

const receiptGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const receiptBox: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.92)",
  padding: 12,
};

const receiptK: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.55)",
  textTransform: "uppercase",
};

const receiptV: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 900,
  color: "rgba(2,6,23,.88)",
};

const receiptM: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(2,6,23,.60)",
};

const receiptFootNote: React.CSSProperties = {
  marginTop: 12,
  padding: "10px 12px",
  borderRadius: 16,
  border: "1px dashed rgba(0,0,0,.12)",
  background: "rgba(2,6,23,.02)",
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(2,6,23,.72)",
};

const receiptActions: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  flexWrap: "wrap",
};

const receiptBtnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderRadius: 16,
  border: "1px solid rgba(2,6,23,.18)",
  background: "rgba(2,6,23,.95)",
  color: "white",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(2,6,23,.22)",
};

const receiptBtnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  color: "rgba(2,6,23,.86)",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};
