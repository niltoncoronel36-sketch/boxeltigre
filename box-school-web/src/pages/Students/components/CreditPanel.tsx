import React, { useEffect, useMemo, useState } from "react";
import "./CreditPanel.css";

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

/* ✅ DATA EMPRESA */
const BUSINESS = {
  name: "Club de Box El Tigre",
  ruc: "",
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
  const base = todayYmd();
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
    <div className="cp-modal cp-modal--receipt" onMouseDown={onClose}>
      <div className="cp-receipt" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cp-receiptHead">
          <div className="cp-receiptTitle">Nota de venta — Cuota</div>
          <button className="cp-iconBtn" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="cp-receiptBody">
          <div className="cp-biz">
            <div className="cp-bizName">{BUSINESS.name}</div>
            <div className="cp-bizLine">{BUSINESS.address}</div>
            <div className="cp-bizLine">{BUSINESS.city}</div>
            <div className="cp-bizLine">
              Tel: <b>{BUSINESS.phone}</b>
              {BUSINESS.ruc ? (
                <>
                  {" "}
                  • RUC: <b>{BUSINESS.ruc}</b>
                </>
              ) : null}
            </div>
          </div>

          <div className="cp-receiptTop">
            <div>
              <div className="cp-k">N°</div>
              <div className="cp-receiptNo">{receiptNo}</div>
              <div className="cp-m">
                Pago exacto: <b>{paidAtExact}</b>
              </div>
            </div>
            <div className="cp-receiptTotal">
              <div className="cp-k">Total</div>
              <div className="cp-receiptAmount">{moneyPENFromCents(charge.amount_cents)}</div>
            </div>
          </div>

          <div className="cp-receiptGrid">
            <div className="cp-box">
              <div className="cp-k">Alumno</div>
              <div className="cp-v">{studentName}</div>
              <div className="cp-m">Matrícula ID: {enrollment.id}</div>
              <div className="cp-m">Categoría: {category}</div>
            </div>

            <div className="cp-box">
              <div className="cp-k">Detalle</div>
              <div className="cp-v">Cuota #{installmentNumber ?? "—"}</div>
              <div className="cp-m">Vence: {fmtYmd(charge.due_on)}</div>
              <div className="cp-m">Mensualidad ref.: {moneyPENFromCents(monthlyFeeCents)}</div>
            </div>

            <div className="cp-box">
              <div className="cp-k">Método</div>
              <div className="cp-v">{methodLabel((charge as any).method)}</div>
            </div>

            <div className="cp-box">
              <div className="cp-k">Fecha</div>
              <div className="cp-v">{fmtYmd((charge as any).paid_on) ?? "—"}</div>
              <div className="cp-m">Hora exacta: {paidAtExact}</div>
            </div>

            <div className="cp-box cp-box--full">
              <div className="cp-k">Términos y condiciones</div>
              <div className="cp-termsList">
                {BUSINESS.terms.map((t, i) => (
                  <div key={i} className="cp-m">
                    • {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cp-note">* Comprobante interno con fecha/hora exacta (seguridad).</div>
        </div>

        <div className="cp-receiptActions">
          <button className="cp-btn cp-btn--dark" onClick={doPrint} type="button">
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
          <button className="cp-btn" onClick={onClose} type="button">
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

      <div className="cp-card">
        <div className="cp-head">
          <div className="cp-titleRow">
            <Calculator size={16} className="cp-iconAccent" />
            <span className="cp-title">Plan de cuotas</span>
          </div>

          {hasPlan && !open ? <span className="cp-badge">Programado</span> : null}
        </div>

        {!enabled ? (
          <div className="cp-locked">
            <Lock size={14} />
            <span>Habilite el pago inicial para programar crédito</span>
          </div>
        ) : (
          <div className="cp-body">
            {hasPlan && !open ? (
              <>
                <div className="cp-summary">
                  <div className="cp-summaryItem">
                    <div className="cp-k">Crédito total</div>
                    <div className="cp-summaryValue">{moneyPENFromCents(planTotalCents)}</div>
                  </div>

                  <div className="cp-divider" />

                  <div className="cp-summaryItem">
                    <div className="cp-k">Cuotas</div>
                    <div className="cp-summaryValue">
                      {planCuotas || "—"}{" "}
                      {planCuotas ? (
                        <span className="cp-muted">
                          de {moneyPENFromCents(planTotalCents / Math.max(1, planCuotas))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="cp-stats">
                  <div className="cp-stat">
                    <div className="cp-k">Pagadas</div>
                    <div className="cp-statValue cp-green">{paidCount}</div>
                  </div>
                  <div className="cp-stat">
                    <div className="cp-k">Pendientes</div>
                    <div className="cp-statValue cp-amber">{pendingCount}</div>
                  </div>
                  <div className="cp-stat">
                    <div className="cp-k">Día cobro</div>
                    <div className="cp-statValue">{planBillingDay || 5}</div>
                  </div>
                </div>

                <div className="cp-method">
                  <span className="cp-methodLabel">Método para pagar cuotas:</span>
                  <select
                    className="cp-input"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                </div>

                <div className="cp-installments">
                  <div className="cp-installmentsHead">
                    <div className="cp-installmentsTitle">
                      <Info size={14} />
                      <span>Cuotas programadas</span>
                    </div>

                    <button
                      type="button"
                      className="cp-btn cp-btn--ghost"
                      onClick={downloadHistoryPdf}
                      disabled={!installments || !installments.length}
                      title={!installments ? "Aún no hay cuotas reales en backend" : "Imprimir/Guardar PDF"}
                    >
                      <Printer size={14} /> Historial (PDF)
                    </button>

                    <div className="cp-loadHint">{installmentsLoading ? "Cargando..." : ""}</div>
                  </div>

                  <div className="cp-installmentsBody">
                    {rows.map((row) => {
                      const paid = row.status === "paid";
                      const partial = row.status === "partial";
                      const remaining = Math.max(0, row.amount_cents - (row.paid_cents || 0));

                      return (
                        <div key={row.key} className="cp-row">
                          <div className="cp-rowLeft">
                            <div className="cp-rowTop">
                              <span className="cp-idx">#{row.idx}</span>
                              <span className="cp-due">{fmtYmd(row.due_on)}</span>
                            </div>

                            <div className="cp-amount">{moneyPENFromCents(row.amount_cents)}</div>

                            {partial ? (
                              <div className="cp-partial">
                                Parcial: {moneyPENFromCents(row.paid_cents)} • Falta:{" "}
                                <b>{moneyPENFromCents(remaining)}</b>
                              </div>
                            ) : null}
                          </div>

                          <div className="cp-rowRight">
                            {paid && row.charge ? (
                              <>
                                <div className="cp-paid">
                                  <CheckCircle size={14} />
                                  Pagada
                                </div>
                                <button
                                  type="button"
                                  className="cp-iconBtn"
                                  onClick={() => openReceiptForPaid(row.charge, row.idx)}
                                  title="Ver / imprimir nota de venta"
                                >
                                  <FileText size={14} />
                                </button>
                              </>
                            ) : row.charge ? (
                              <button
                                className="cp-btn cp-btn--primary"
                                type="button"
                                disabled={loading}
                                onClick={() => handlePayCharge(row.charge, row.idx)}
                              >
                                Pagar cuota
                              </button>
                            ) : (
                              <div className="cp-noBackend" title="Aún no hay cuotas reales en backend">
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
            ) : null}

            <button
              className={`cp-toggle ${open ? "is-open" : ""}`}
              type="button"
              onClick={() => {
                if (open) return closeEditor();
                openEditor();
              }}
            >
              {open ? <ChevronUp size={16} /> : <CreditCard size={16} />}
              {open ? "Cancelar edición" : hasPlan ? "Re-programar cuotas" : "Configurar crédito"}
            </button>

            {open ? (
              <div className="cp-editor">
                <div className="cp-formGrid">
                  <div className="cp-field">
                    <div className="cp-label">Monto total (S/)</div>
                    <input
                      className="cp-input"
                      value={creditForm.total_soles}
                      onChange={(e) =>
                        setCreditForm((f) => ({ ...f, total_soles: e.target.value.replace(/[^\d.]/g, "") }))
                      }
                      inputMode="decimal"
                      placeholder="Ej: 600.00"
                    />
                  </div>

                  <div className="cp-field">
                    <div className="cp-label">N° cuotas</div>
                    <input
                      className="cp-input"
                      value={creditForm.cuotas}
                      onChange={(e) =>
                        setCreditForm((f) => ({ ...f, cuotas: Number(e.target.value.replace(/[^\d]/g, "")) || 1 }))
                      }
                      inputMode="numeric"
                    />
                  </div>

                  <div className="cp-field cp-field--full">
                    <div className="cp-label">Primer vencimiento (define el día de cobro)</div>
                    <div className="cp-dateWrap">
                      <CalendarDays size={14} className="cp-dateIcon" />
                      <input
                        className="cp-input cp-dateInput"
                        type="date"
                        value={creditForm.pay_day_date}
                        onChange={(e) => setCreditForm((f) => ({ ...f, pay_day_date: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="cp-preview">
                  <div className="cp-previewHead">
                    <Info size={14} />
                    <span>
                      Vista previa: {cuotas} cuotas de <b>{moneyPENFromCents(cuotaCentsPreview)}</b>{" "}
                      <span className="cp-muted">• Día cobro: <b>{creditPayDay}</b></span>
                    </span>
                  </div>

                  <div className="cp-previewBody">
                    {schedulePreview.length === 0 ? (
                      <div className="cp-previewEmpty">Ingresa un monto mayor a 0 para ver el cronograma.</div>
                    ) : (
                      <table className="cp-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Vencimiento</th>
                            <th className="cp-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedulePreview.map((row) => (
                            <tr key={row.idx}>
                              <td>{row.idx}</td>
                              <td>{row.due_on}</td>
                              <td className="cp-right">{moneyPENFromCents(row.amount_cents)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {savedOk ? (
                  <div className="cp-ok">
                    <CheckCircle size={16} /> Programación guardada
                  </div>
                ) : null}

                <button
                  className="cp-btn cp-btn--save"
                  type="button"
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
                    "Procesando..."
                  ) : (
                    <>
                      <Save size={16} /> Guardar programación
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
