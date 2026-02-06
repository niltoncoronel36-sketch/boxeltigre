import React, { useEffect, useMemo, useState } from "react";
import "./StudentProfileModal.css";

import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Edit3,
  FileText,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  Mail,
  Phone,
  Printer,
  Settings,
  ShieldCheck,
  User,
  X,
  Zap,
  Award,
  Calendar,
  Trash2,
} from "lucide-react";

import type { Student } from "../../../services/students";
import type { Category } from "../../../services/categories";
import { listActiveCategories } from "../../../services/categories";
import type { Enrollment, PaymentMethod } from "../../../services/enrollments";
import { listEnrollments, getInitialPayment, saveInitialPayment } from "../../../services/enrollments";
import { getApiErrorMessage } from "../../../services/api";

import { EnrollmentManager } from "./EnrollmentManager";
import { CreditPanel } from "./CreditPanel";

import { calcAge, todayYmd } from "../utils/dates";
import { moneyPENFromCents } from "../utils/money";
import { categoryLabel, formatName, getCurrentEnrollment, getMonthlyFeeCents } from "../utils/helpers";

/**
 * ✅ Datos empresa (solo data)
 */
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
    "La matrícula corresponde al plan/categoría registrada.",
  ],
};

/** ✅ Escape básico para HTML (evita que se rompa el print) */
function esc(v: any) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type InitialPayment = {
  paid: boolean;
  paid_on: string;
  method: PaymentMethod;
};

type InitialReceipt = {
  id: number;
  enrollment_id: number;
  student_id: number;
  category_id: number | null;
  concept: string;
  amount_cents: number;
  paid_cents: number;
  status: string;
  paid_on: string | null;
  method: PaymentMethod | null;
  created_at?: string;
};

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

/**
 * ✅ Tu print actual se mantiene (no te cambio el estilo)
 */
function printHtml(title: string, html: string) {
  const w = window.open("", "_blank", "width=860,height=900");
  if (!w) return;

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111827; }
    .paper { max-width: 720px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; padding: 20px; }
    .row { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; }
    .muted { color:#6b7280; font-size: 12px; }
    .title { font-size: 18px; font-weight: 800; margin: 0; }
    .subtitle { font-size: 12px; font-weight: 700; color:#374151; margin-top: 4px; }
    .tag { display:inline-block; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background:#111827; color:#fff; }
    .hr { height:1px; background:#e5e7eb; margin: 14px 0; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; }
    .k { font-size: 11px; font-weight: 800; color:#6b7280; letter-spacing: .4px; }
    .v { font-size: 13px; font-weight: 700; color:#111827; margin-top: 4px; }
    .total { font-size: 22px; font-weight: 900; }
    @media print {
      body { margin: 0; }
      .paper { border: none; border-radius: 0; }
    }
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

function ReceiptModal(props: {
  open: boolean;
  onClose: () => void;
  receipt: InitialReceipt | null;
  student: Student;
  enrollment: Enrollment | null;
  amountCents: number;
}) {
  const { open, onClose, receipt, student, enrollment, amountCents } = props;
  if (!open) return null;

  const receiptNo = receipt?.id ? `NV-${pad(receipt.id)}` : `NV-${pad(student.id)}-${Date.now()}`;
  const paidOn = receipt?.paid_on || todayYmd();
  const method = (receipt?.method ?? "cash") as PaymentMethod;

  const categoryName =
    enrollment?.category
      ? categoryLabel(enrollment.category as any)
      : receipt?.category_id
      ? `Categoría #${receipt.category_id}`
      : enrollment?.category_id
      ? `Categoría #${enrollment.category_id}`
      : "—";

  const studentFullName = formatName(student);
  const studentDni = (student as any).document_number ?? "—";

  function handlePrint() {
    const html = `
      <div class="paper">
        <div class="row">
          <div>
            <p class="title">NOTA DE VENTA</p>
            <div class="subtitle">Comprobante de pago - Matrícula</div>
            <div class="muted" style="margin-top:8px;">
              <b>${BUSINESS.name}</b><br/>
              ${BUSINESS.address}<br/>
              ${BUSINESS.city}<br/>
              Tel: ${BUSINESS.phone}
              ${BUSINESS.ruc ? `<br/>RUC: ${BUSINESS.ruc}` : ``}
            </div>
            <div class="muted" style="margin-top:10px;">Emitido: ${paidOn}</div>
          </div>
          <div style="text-align:right;">
            <div class="tag">${receiptNo}</div>
            <div class="muted" style="margin-top:8px;">Estado: PAGADO</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="grid">
          <div class="box">
            <div class="k">ALUMNO</div>
            <div class="v">${esc(studentFullName)}</div>
            <div class="muted" style="margin-top:4px;">DNI: ${esc(studentDni)}</div>
          </div>

          <div class="box">
            <div class="k">DETALLE</div>
            <div class="v">Pago inicial (Matrícula)</div>
            <div class="muted" style="margin-top:4px;">Categoría: ${esc(categoryName)}</div>
          </div>

          <div class="box">
            <div class="k">MÉTODO</div>
            <div class="v">${esc(methodLabel(method))}</div>
            <div class="muted" style="margin-top:4px;">Fecha: ${esc(paidOn)}</div>
          </div>

          <div class="box">
            <div class="k">TOTAL</div>
            <div class="v total">${esc(moneyPENFromCents(amountCents))}</div>
            <div class="muted" style="margin-top:4px;">Moneda: PEN</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="muted">
          * Este comprobante es generado por el sistema. Conservar para control interno.
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
    <div className="sp-overlay sp-overlay--receipt" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="sp-receipt" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sp-receipt__head">
          <div>
            <div className="sp-receipt__title">Nota de venta</div>
            <div className="sp-receipt__sub">Matrícula • {receiptNo}</div>
          </div>

          <button className="sp-iconBtn" type="button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="sp-receipt__biz">
          <div className="sp-biz__name">{BUSINESS.name}</div>
          <div className="sp-biz__line">{BUSINESS.address}</div>
          <div className="sp-biz__line">{BUSINESS.city}</div>
          <div className="sp-biz__line">
            Tel: <b>{BUSINESS.phone}</b>
            {BUSINESS.ruc ? (
              <>
                {" "}
                • RUC: <b>{BUSINESS.ruc}</b>
              </>
            ) : null}
          </div>
        </div>

        <div className="sp-receipt__summary">
          <div className="sp-box">
            <div className="sp-k">Alumno</div>
            <div className="sp-v">{studentFullName}</div>
            <div className="sp-m">DNI: {studentDni}</div>
          </div>

          <div className="sp-box">
            <div className="sp-k">Detalle</div>
            <div className="sp-v">Pago inicial (Matrícula)</div>
            <div className="sp-m">Categoría: {categoryName}</div>
          </div>

          <div className="sp-box">
            <div className="sp-k">Método</div>
            <div className="sp-v">{methodLabel(method)}</div>
            <div className="sp-m">Fecha: {paidOn}</div>
          </div>

          <div className="sp-box sp-box--total">
            <div className="sp-k">Total</div>
            <div className="sp-total">{moneyPENFromCents(amountCents)}</div>
            <div className="sp-m">PEN</div>
          </div>
        </div>

        <div className="sp-receipt__actions">
          <button className="sp-btn sp-btn--primary" type="button" onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="sp-btn sp-btn--ghost" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudentProfileModal(props: {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onEdit: (s: Student) => void;
  onToggleActive: (s: Student) => Promise<void>;
  onDeleteStudent: (s: Student) => Promise<void>;
}) {
  const { open, student, onClose, onEdit, onToggleActive, onDeleteStudent } = props;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [initialPaymentByEnrollment, setInitialPaymentByEnrollment] = useState<Record<number, InitialPayment>>({});
  const [receiptByEnrollment, setReceiptByEnrollment] = useState<Record<number, InitialReceipt | null>>({});
  const [receiptOpen, setReceiptOpen] = useState(false);

  // ✅ transición: cuando open true, montamos con animación
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const t = window.setTimeout(() => setMounted(true), 0);
      return () => window.clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  // ✅ ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const refreshEnrollments = async () => {
    if (!student) return;
    const enr = await listEnrollments({ studentId: student.id, perPage: 50 });
    setEnrollments(enr.data);
  };

  useEffect(() => {
    if (!open || !student) return;

    let cancelled = false;
    setErr(null);
    setManageOpen(false);
    setLoading(true);

    (async () => {
      try {
        const [cats, enr] = await Promise.all([
          listActiveCategories(),
          listEnrollments({ studentId: student.id, perPage: 50 }),
        ]);
        if (cancelled) return;
        setCategories(cats);
        setEnrollments(enr.data);
      } catch (e) {
        if (cancelled) return;
        setErr(getApiErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, student?.id]);

  const currentEnrollment = useMemo(
    () => getCurrentEnrollment(enrollments as any) as any as Enrollment | null,
    [enrollments]
  );

  const currentFeeCents = useMemo(
    () => (currentEnrollment ? getMonthlyFeeCents(currentEnrollment as any, categories as any) : 0),
    [currentEnrollment, categories]
  );

  const isActive = useMemo(() => {
    const v: any = (student as any)?.is_active;
    return v === true || v === 1 || v === "1";
  }, [student]);

  useEffect(() => {
    if (!currentEnrollment) return;
    const id = currentEnrollment.id;
    setInitialPaymentByEnrollment((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: { paid: false, paid_on: todayYmd(), method: "cash" } };
    });
  }, [currentEnrollment?.id]);

  useEffect(() => {
    if (!open || !currentEnrollment) return;

    let cancelled = false;
    const id = currentEnrollment.id;

    (async () => {
      setPaymentLoading(true);
      try {
        const charge: any = await getInitialPayment(id);
        if (cancelled) return;

        const paid = String(charge?.status ?? "") === "paid";
        const paid_on = (charge?.paid_on as any) ?? todayYmd();
        const method = (charge?.method as any) ?? "cash";

        setInitialPaymentByEnrollment((prev) => ({
          ...prev,
          [id]: { paid, paid_on, method },
        }));

        setReceiptByEnrollment((prev) => ({
          ...prev,
          [id]: charge ? (charge as InitialReceipt) : null,
        }));
      } catch {
        // si no existe, no rompe
      } finally {
        if (!cancelled) setPaymentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, currentEnrollment?.id]);

  const initialPayment = currentEnrollment ? initialPaymentByEnrollment[currentEnrollment.id] : null;
  const isPaid = !!initialPayment?.paid;
  const currentReceipt = currentEnrollment ? receiptByEnrollment[currentEnrollment.id] ?? null : null;

  if (!open || !student) return null;

  const initials = `${student.first_name?.[0] ?? ""}${student.last_name?.[0] ?? ""}`.toUpperCase();

  async function handleToggleActive() {
    try {
      setErr(null);
      setLoading(true);
      await onToggleActive(student);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStudent() {
    if (!window.confirm(`¿Eliminar a ${formatName(student)}?`)) return;
    try {
      setErr(null);
      setLoading(true);
      await onDeleteStudent(student);
      onClose();
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function setPaymentPatch(patch: Partial<InitialPayment>) {
    if (!currentEnrollment) return;
    const id = currentEnrollment.id;
    setInitialPaymentByEnrollment((prev) => ({
      ...prev,
      [id]: {
        paid: prev[id]?.paid ?? false,
        paid_on: prev[id]?.paid_on ?? todayYmd(),
        method: prev[id]?.method ?? "cash",
        ...patch,
      },
    }));
  }

  async function commitInitialPayment() {
    if (!currentEnrollment) return;

    const localMethod = initialPayment?.method ?? "cash";
    const localPaidOn = initialPayment?.paid_on ?? todayYmd();

    setPaymentPatch({ paid: true });

    try {
      setPaymentLoading(true);

      const res: any = await saveInitialPayment(currentEnrollment.id, {
        paid: true,
        method: localMethod,
        paid_on: localPaidOn,
      });

      setInitialPaymentByEnrollment((prev) => ({
        ...prev,
        [currentEnrollment.id]: {
          paid: String(res?.status ?? "") === "paid",
          paid_on: (res?.paid_on as any) ?? localPaidOn,
          method: (res?.method as any) ?? localMethod,
        },
      }));

      setReceiptByEnrollment((prev) => ({
        ...prev,
        [currentEnrollment.id]: res ? (res as InitialReceipt) : null,
      }));

      setReceiptOpen(true);
    } catch (e: any) {
      setErr(getApiErrorMessage(e));
      setPaymentPatch({ paid: false });
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <>
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={currentReceipt}
        student={student}
        enrollment={currentEnrollment}
        amountCents={currentFeeCents}
      />

      <div
        className={`sp-overlay ${mounted ? "is-open" : ""}`}
        onMouseDown={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div className="sp-card" onMouseDown={(e) => e.stopPropagation()}>
          {/* Banner (sticky) */}
          <div className="sp-banner">
            <button className="sp-close" type="button" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>

            <div className="sp-banner__content">
              <div className="sp-avatarWrap">
                <div className="sp-avatar">{initials}</div>
                <span className={`sp-dot ${isActive ? "is-on" : "is-off"}`} />
              </div>

              <div className="sp-bannerInfo">
                <div className="sp-nameRow">
                  <h2 className="sp-name">{formatName(student)}</h2>
                  {isActive ? <ShieldCheck size={20} className="sp-iconOk" /> : null}
                </div>

                <div className="sp-badges">
                  <span className="sp-pill">DNI: {(student as any).document_number ?? "—"}</span>
                  <span className={`sp-status ${isActive ? "is-active" : "is-inactive"}`}>
                    {isActive ? "• CUENTA ACTIVA" : "• CUENTA INACTIVA"}
                  </span>
                </div>
              </div>
            </div>

            <div className="sp-stats">
              <div className="sp-stat">
                <div className="sp-stat__k">
                  <Zap size={12} /> Estado
                </div>
                <div className="sp-stat__v">{isActive ? "Activo" : "Inactivo"}</div>
              </div>

              <div className="sp-stat">
                <div className="sp-stat__k">
                  <Award size={12} /> Categoría
                </div>
                <div className="sp-stat__v">
                  {currentEnrollment?.category ? categoryLabel(currentEnrollment.category as any) : "Sin Matrícula"}
                </div>
              </div>
            </div>
          </div>

          {err ? (
            <div className="sp-alert">
              <AlertCircle size={16} /> {err}
            </div>
          ) : null}

          {/* Main grid */}
          <div className="sp-grid">
            {/* Left */}
            <div className="sp-panel">
              <div className="sp-panelHead">
                <div className="sp-sectionTitle">Datos del estudiante</div>
                <button className="sp-btn sp-btn--ghost" type="button" onClick={() => onEdit(student)}>
                  <Edit3 size={14} /> Editar
                </button>
              </div>

              <div className="sp-infoGrid">
                <InfoTile icon={<User size={18} />} label="Nombre completo" value={formatName(student)} />
                <InfoTile icon={<Fingerprint size={18} />} label="Documento (DNI)" value={(student as any).document_number ?? "—"} />
                <InfoTile
                  icon={<Calendar size={18} />}
                  label="Nacimiento"
                  value={`${(student as any).birthdate ?? "—"} (${calcAge((student as any).birthdate)} años)`}
                />
                <InfoTile icon={<Phone size={18} />} label="Teléfono" value={(student as any).phone || "No registrado"} />
                <InfoTile icon={<Mail size={18} />} label="Email" value={(student as any).email || "—"} />
              </div>

              <div className="sp-sectionTitle sp-sectionTitle--soft">Contacto de emergencia</div>
              <div className="sp-infoGrid">
                <InfoTile icon={<HeartPulse size={18} />} label="Nombre" value={(student as any).emergency_contact_name || "No asignado"} />
                <InfoTile icon={<Phone size={18} />} label="Teléfono" value={(student as any).emergency_contact_phone || "No asignado"} />
              </div>

              <div className="sp-actions">
                <button
                  className={`sp-btn ${isActive ? "sp-btn--warn" : "sp-btn--ok"}`}
                  type="button"
                  onClick={handleToggleActive}
                  disabled={loading}
                >
                  {isActive ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                  {isActive ? "Suspender" : "Activar"}
                </button>

                <button className="sp-btn sp-btn--danger" type="button" onClick={handleDeleteStudent} disabled={loading}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>

            {/* Right */}
            <div className="sp-panel">
              <div className="sp-sectionTitle">Gestión financiera</div>

              {currentEnrollment ? (
                <div className="sp-fin">
                  <div className={`sp-payCard ${isPaid ? "is-paid" : "is-pending"}`}>
                    <div className="sp-payHead">
                      <div className="sp-payTitle">
                        Pago inicial (Matrícula)
                        {isPaid ? (
                          <button
                            type="button"
                            className="sp-iconBtn"
                            title="Ver nota de venta"
                            onClick={() => setReceiptOpen(true)}
                            disabled={!currentReceipt && paymentLoading}
                          >
                            <FileText size={16} />
                          </button>
                        ) : null}
                      </div>

                      <div className="sp-payAmount">{moneyPENFromCents(currentFeeCents)}</div>
                    </div>

                    {!isPaid ? (
                      <div className="sp-payActions">
                        <select
                          className="sp-input"
                          value={initialPayment?.method ?? "cash"}
                          onChange={(e) => setPaymentPatch({ method: e.target.value as PaymentMethod })}
                          disabled={paymentLoading}
                        >
                          <option value="cash">Efectivo</option>
                          <option value="card">Tarjeta</option>
                          <option value="yape">Yape</option>
                          <option value="plin">Plin</option>
                          <option value="transfer">Transferencia</option>
                        </select>

                        <input
                          className="sp-input"
                          type="date"
                          value={initialPayment?.paid_on ?? todayYmd()}
                          onChange={(e) => setPaymentPatch({ paid_on: e.target.value })}
                          disabled={paymentLoading}
                        />

                        <button className="sp-btn sp-btn--primary" type="button" disabled={paymentLoading} onClick={commitInitialPayment}>
                          <CheckCircle2 size={16} />
                          {paymentLoading ? "Validando…" : "Validar pago"}
                        </button>
                      </div>
                    ) : (
                      <div className="sp-paid">
                        <div className="sp-paidOk">
                          <CheckCircle2 size={18} /> Matrícula pagada
                        </div>
                        <div className="sp-paidNote">✅ Pagado y registrado. Puedes ver / imprimir la nota de venta.</div>
                        <button type="button" className="sp-btn sp-btn--ghost" onClick={() => setReceiptOpen(true)}>
                          <Printer size={16} /> Imprimir nota de venta
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ✅ coherencia: lo que esté dentro del modal también se ve “pro” */}
                  <div className="sp-subCard">
                    <CreditPanel
                      enrollment={currentEnrollment}
                      monthlyFeeCents={currentFeeCents}
                      enabled={isPaid}
                      loading={loading}
                      setLoading={setLoading}
                      setErr={setErr}
                      onRefresh={refreshEnrollments}
                    />
                  </div>

                  <button
                    type="button"
                    className="sp-sheetBtn"
                    onClick={() => {
                      onClose();
                      navigate(`/students/${student.id}/enrollment-sheet`);
                    }}
                  >
                    <div className="sp-sheetIcon">
                      <FileText size={20} />
                    </div>
                    <div className="sp-sheetText">
                      <div className="sp-sheetTitle">Imprimir ficha</div>
                      <div className="sp-sheetSub">Expediente #00{student.id}</div>
                    </div>
                    <Printer size={18} className="sp-sheetArrow" />
                  </button>
                </div>
              ) : (
                <div className="sp-empty">
                  <GraduationCap size={44} />
                  <div className="sp-emptyTitle">Sin matrícula activa</div>
                  <button className="sp-btn sp-btn--primary" type="button" onClick={() => setManageOpen(true)}>
                    Matricular ahora
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer / History */}
          <div className="sp-footer">
            <button className="sp-toggle" type="button" onClick={() => setManageOpen(!manageOpen)}>
              {manageOpen ? <X size={16} /> : <Settings size={16} />}
              <span>{manageOpen ? "Cerrar historial" : "Historial de matrículas"}</span>
            </button>

            {manageOpen ? (
              <div className="sp-collapse">
                <EnrollmentManager
                  studentId={student.id}
                  categories={categories}
                  enrollments={enrollments}
                  loading={loading}
                  setLoading={setLoading}
                  setErr={setErr}
                  onRefresh={refreshEnrollments}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoTile({ icon, label, value }: any) {
  return (
    <div className="sp-tile">
      <div className="sp-tileIcon">{icon}</div>
      <div className="sp-tileBody">
        <div className="sp-tileLabel">{label}</div>
        <div className="sp-tileValue">{value}</div>
      </div>
    </div>
  );
}
