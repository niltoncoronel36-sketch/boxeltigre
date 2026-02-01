import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CreditCard,
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
 * ✅ Datos generales de empresa (solo data, sin estilos extra)
 * Edita aquí.
 */
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
 * ✅ Tu print actual se mantiene (no te cambio el estilo).
 * Solo sanitizo el <title>.
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

  // ✅ DATA EMPRESA (edita a tu gusto)
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
      "La matrícula corresponde al plan/categoría registrada.",
    ],
  };

  const receiptNo = receipt?.id ? `NV-${pad(receipt.id)}` : `NV-${pad(student.id)}-${Date.now()}`;
  const paidOn = receipt?.paid_on || todayYmd();
  const method = (receipt?.method ?? "cash") as PaymentMethod;

  // ✅ Categoría con fallback
  const categoryName =
    enrollment?.category
      ? categoryLabel(enrollment.category as any)
      : receipt?.category_id
      ? `Categoría #${receipt.category_id}`
      : enrollment?.category_id
      ? `Categoría #${enrollment.category_id}`
      : "—";

  // ✅ Datos alumno
  const studentFullName = formatName(student);
  const studentDni = (student as any).document_number ?? "—";

  function handlePrint() {
    // Mantén tu impresión actual (si ya la tienes modificada).
    // Si quieres, aquí también puedes reutilizar el mismo contenido.
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
            <div class="v">${studentFullName}</div>
            <div class="muted" style="margin-top:4px;">DNI: ${studentDni}</div>
          </div>

          <div class="box">
            <div class="k">DETALLE</div>
            <div class="v">Pago inicial (Matrícula)</div>
            <div class="muted" style="margin-top:4px;">Categoría: ${categoryName}</div>
          </div>

          <div class="box">
            <div class="k">MÉTODO</div>
            <div class="v">${methodLabel(method)}</div>
            <div class="muted" style="margin-top:4px;">Fecha: ${paidOn}</div>
          </div>

          <div class="box">
            <div class="k">TOTAL</div>
            <div class="v total">${moneyPENFromCents(amountCents)}</div>
            <div class="muted" style="margin-top:4px;">Moneda: PEN</div>
          </div>
        </div>

        <div class="hr"></div>

        <div class="muted">
          * Este comprobante es generado por el sistema. Conservar para control interno.
        </div>

        <div class="muted" style="margin-top:10px;">
          <b>Términos y condiciones</b><br/>
          ${BUSINESS.terms.map((t) => `• ${t}`).join("<br/>")}
        </div>
      </div>
    `;
    printHtml(`Nota de venta ${receiptNo}`, html);
  }

  return (
    <div style={receiptOverlay} onMouseDown={onClose}>
      <div style={receiptCard} onMouseDown={(e) => e.stopPropagation()}>
        {/* Header modal */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Nota de venta — Matrícula</div>
          <div style={{ marginLeft: "auto" }}>
            <button style={receiptCloseBtn} onClick={onClose} type="button">
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={receiptBody}>
          {/* ✅ DATOS EMPRESA (igual que impresión) */}
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

          {/* Resumen */}
          <div style={receiptHeaderRow}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 12, color: "#6b7280" }}>N°</div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{receiptNo}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginTop: 4 }}>
                Emitido: <b style={{ color: "#111827" }}>{paidOn}</b>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: 12, color: "#6b7280" }}>Total</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{moneyPENFromCents(amountCents)}</div>
            </div>
          </div>

          {/* Grid detalles */}
          <div style={receiptGrid}>
            <div style={receiptBox}>
              <div style={receiptK}>Alumno</div>
              <div style={receiptV}>{studentFullName}</div>
              <div style={receiptM}>DNI: {studentDni}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Detalle</div>
              <div style={receiptV}>Pago inicial (Matrícula)</div>
              <div style={receiptM}>Categoría: {categoryName}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Método</div>
              <div style={receiptV}>{methodLabel(method)}</div>
            </div>

            <div style={receiptBox}>
              <div style={receiptK}>Fecha</div>
              <div style={receiptV}>{paidOn}</div>
            </div>
          </div>

          <div style={receiptFootNote}>
            * Generado por el sistema. Conserva para control interno.
          </div>

          {/* ✅ TÉRMINOS (igual que impresión) */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 12, color: "#111827", marginBottom: 6 }}>
              Términos y condiciones
            </div>
            <div style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 800, color: "#475569" }}>
              {BUSINESS.terms.map((t, i) => (
                <div key={i}>• {t}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={receiptActions}>
          <button style={receiptBtnPrimary} onClick={handlePrint} type="button">
            <Printer size={16} /> Imprimir nota de venta
          </button>
          <button style={receiptBtnSecondary} onClick={onClose} type="button">
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

  const refreshEnrollments = async () => {
    if (!student) return;
    const enr = await listEnrollments({ studentId: student.id, perPage: 50 });
    setEnrollments(enr.data);
  };

  // ✅ Carga inicial (con cancelación para evitar setState cuando se cierra)
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

  // ✅ Default local payment state para el enrollment actual (si falta)
  useEffect(() => {
    if (!currentEnrollment) return;
    const id = currentEnrollment.id;
    setInitialPaymentByEnrollment((prev) => {
      if (prev[id]) return prev;
      return { ...prev, [id]: { paid: false, paid_on: todayYmd(), method: "cash" } };
    });
  }, [currentEnrollment?.id]);

  // ✅ Carga estado real del pago inicial desde backend
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
        // backend aún no implementado / o sin registro
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

    // optimista
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

      <div style={overlayStyle} onMouseDown={onClose}>
        <div style={profileCardStyle} onMouseDown={(e) => e.stopPropagation()}>
          <div style={premiumBannerStyle}>
            <button style={closeCircleStyle} onClick={onClose}>
              <X size={20} color="white" />
            </button>

            <div style={lightEffectStyle} />

            <div style={headerContentStyle}>
              <div style={avatarContainerStyle}>
                <div style={largeAvatarStyle}>{initials}</div>
                <div style={onlineStatusStyle(isActive)} />
              </div>

              <div style={bannerInfoStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h1 style={nameTitleStyle}>{formatName(student).toUpperCase()}</h1>
                  {isActive && <ShieldCheck size={26} color="#4ade80" />}
                </div>

                <div style={badgeRowStyle}>
                  <span style={premiumBadgeStyle}>DNI: {(student as any).document_number ?? "—"}</span>
                  <span style={statusPillStyle(isActive)}>
                    {isActive ? "• CUENTA ACTIVA" : "• CUENTA INACTIVA"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={dynamicStatsBarStyle}>
            <div style={statColumnStyle}>
              <div style={statLabelContainer}>
                <Zap size={12} /> ESTADO ACTUAL
              </div>
              <div style={statValueStyle}>{isActive ? "Activo" : "Inactivo"}</div>
            </div>

            <div style={statColumnStyle}>
              <div style={statLabelContainer}>
                <Award size={12} /> CATEGORÍA
              </div>
              <div style={statValueStyle}>
                {currentEnrollment?.category ? categoryLabel(currentEnrollment.category as any) : "Sin Matrícula"}
              </div>
            </div>
          </div>

          {err && (
            <div style={errorAlertStyle}>
              <AlertCircle size={16} /> {err}
            </div>
          )}

          <div style={mainContentGrid}>
            <div style={contentPanel}>
              <div style={panelHeaderStyle}>
                <h3 style={sectionTitleStyle}>DATOS DEL ESTUDIANTE</h3>
                <button style={minimalEditBtn} onClick={() => onEdit(student)}>
                  <Edit3 size={14} /> EDITAR PERFIL
                </button>
              </div>

              <div style={infoGridModern}>
                <InfoTile icon={<User size={18} />} label="Nombre completo" value={formatName(student)} />
                <InfoTile
                  icon={<Fingerprint size={18} />}
                  label="Documento (DNI)"
                  value={(student as any).document_number ?? "—"}
                />
                <InfoTile
                  icon={<Calendar size={18} />}
                  label="Fecha de nacimiento"
                  value={`${(student as any).birthdate ?? "—"} (${calcAge((student as any).birthdate)} años)`}
                />
                <InfoTile icon={<Phone size={18} />} label="Teléfono personal" value={(student as any).phone || "No registrado"} />
                <InfoTile icon={<Mail size={18} />} label="Correo electrónico" value={(student as any).email || "—"} />
              </div>

              <h3 style={{ ...sectionTitleStyle, marginTop: "30px", borderLeftColor: "#4ade80" }}>
                CONTACTO DE EMERGENCIA
              </h3>
              <div style={infoGridModern}>
                <InfoTile
                  icon={<HeartPulse size={18} />}
                  label="Nombre de contacto"
                  value={(student as any).emergency_contact_name || "No asignado"}
                />
                <InfoTile
                  icon={<Phone size={18} />}
                  label="Teléfono de emergencia"
                  value={(student as any).emergency_contact_phone || "No asignado"}
                />
              </div>

              <div style={actionRowContainer}>
                <button style={secondaryActionBtn(isActive)} onClick={handleToggleActive} disabled={loading}>
                  {isActive ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                  {isActive ? "SUSPENDER" : "ACTIVAR CUENTA"}
                </button>

                <button style={dangerActionBtn} onClick={handleDeleteStudent} disabled={loading}>
                  <Trash2 size={14} /> ELIMINAR
                </button>
              </div>
            </div>

            <div style={contentPanel}>
              <h3 style={sectionTitleStyle}>GESTIÓN FINANCIERA</h3>

              {currentEnrollment ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                  <div style={isPaid ? paymentDoneStyle : paymentPendingStyle}>
                    <div style={paymentHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={paymentTitle}>PAGO INICIAL (MATRÍCULA)</span>

                        {isPaid ? (
                          <button
                            type="button"
                            style={receiptIconBtn}
                            title="Ver nota de venta"
                            onClick={() => setReceiptOpen(true)}
                            disabled={!currentReceipt && paymentLoading}
                          >
                            <FileText size={16} />
                          </button>
                        ) : null}
                      </div>

                      <span style={paymentAmount}>{moneyPENFromCents(currentFeeCents)}</span>
                    </div>

                    {!isPaid ? (
                      <div style={paymentActionGroup}>
                        <select
                          style={modernSelect}
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
                          style={modernDateInput}
                          type="date"
                          value={initialPayment?.paid_on ?? todayYmd()}
                          onChange={(e) => setPaymentPatch({ paid_on: e.target.value })}
                          disabled={paymentLoading}
                        />

                        <button style={primaryValidateBtn} disabled={paymentLoading} onClick={commitInitialPayment}>
                          <CheckCircle2 size={16} />
                          {paymentLoading ? "..." : "VALIDAR PAGO"}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        <div style={successMessageContainer}>
                          <CheckCircle2 size={18} /> MATRÍCULA PAGADA
                        </div>

                        <div style={paidNoteStyle}>
                          ✅ Matrícula pagada y registrada. Puedes ver/imprimir la nota de venta.
                        </div>

                        <button type="button" style={receiptPrintBtn} onClick={() => setReceiptOpen(true)}>
                          <Printer size={16} /> Imprimir nota de venta
                        </button>
                      </div>
                    )}
                  </div>

                  <CreditPanel
                    enrollment={currentEnrollment}
                    monthlyFeeCents={currentFeeCents}
                    enabled={isPaid}
                    loading={loading}
                    setLoading={setLoading}
                    setErr={setErr}
                    onRefresh={refreshEnrollments}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/students/${student.id}/enrollment-sheet`);
                    }}
                    style={printActionBtn}
                  >
                    <div style={printIconWrapper}>
                      <FileText size={20} />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: "14px", fontWeight: 900 }}>IMPRIMIR FICHA</div>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>EXPEDIENTE #00{student.id}</div>
                    </div>
                    <Printer size={18} style={{ marginLeft: "auto", opacity: 0.5 }} />
                  </button>
                </div>
              ) : (
                <div style={emptyStateContainer}>
                  <GraduationCap size={48} color="#e5e7eb" />
                  <p style={{ fontWeight: 700, color: "#9ca3af" }}>Sin Matrícula Activa</p>
                  <button style={createBtnStyle} onClick={() => setManageOpen(true)}>
                    MATRICULAR AHORA
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={footerArea}>
            <button style={footerToggleBtn(manageOpen)} onClick={() => setManageOpen(!manageOpen)}>
              {manageOpen ? <X size={16} /> : <Settings size={16} />}
              <span>{manageOpen ? "CERRAR HISTORIAL" : "HISTORIAL DE MATRÍCULAS"}</span>
            </button>

            {manageOpen && (
              <div style={collapsibleWrapper}>
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Sub-componentes
function InfoTile({ icon, label, value }: any) {
  return (
    <div style={infoTileStyle}>
      <div style={tileIconBox}>{icon}</div>
      <div>
        <div style={tileLabel}>{label}</div>
        <div style={tileValue}>{value}</div>
      </div>
    </div>
  );
}




// =========================
// ✅ ESTILOS (inline styles)
// Pega esto al final de tu archivo (o donde guardas estilos)
// =========================

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, .65)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  zIndex: 50,
};

const profileCardStyle: React.CSSProperties = {
  width: "min(1180px, 96vw)",
  maxHeight: "min(92vh, 980px)",
  overflow: "auto",
  borderRadius: 22,
  background: "rgba(255,255,255,.92)",
  border: "1px solid rgba(255,255,255,.18)",
  boxShadow: "0 20px 80px rgba(0,0,0,.35)",
};

const premiumBannerStyle: React.CSSProperties = {
  position: "relative",
  padding: "26px 26px 18px",
  borderTopLeftRadius: 22,
  borderTopRightRadius: 22,
  background:
    "radial-gradient(1200px 300px at 0% 0%, rgba(255,122,24,.35), transparent 60%), radial-gradient(900px 280px at 100% 0%, rgba(59,130,246,.25), transparent 65%), linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.92))",
  color: "#fff",
  overflow: "hidden",
};

const lightEffectStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(900px 260px at 20% 0%, rgba(255,255,255,.14), transparent 60%), radial-gradient(800px 260px at 80% 10%, rgba(255,255,255,.10), transparent 60%)",
  pointerEvents: "none",
};

const closeCircleStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 42,
  height: 42,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.22)",
  background: "rgba(255,255,255,.08)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const headerContentStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const avatarContainerStyle: React.CSSProperties = {
  position: "relative",
  width: 64,
  height: 64,
  flex: "0 0 auto",
};

const largeAvatarStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  letterSpacing: 0.6,
  fontSize: 18,
  background:
    "linear-gradient(135deg, rgba(255,122,24,.95), rgba(255,190,64,.75))",
  color: "#111827",
  boxShadow: "0 16px 40px rgba(0,0,0,.35)",
  border: "1px solid rgba(255,255,255,.22)",
};

const onlineStatusStyle = (active: boolean): React.CSSProperties => ({
  position: "absolute",
  right: -2,
  bottom: -2,
  width: 16,
  height: 16,
  borderRadius: 999,
  background: active ? "#4ade80" : "#f97316",
  border: "3px solid rgba(2,6,23,.92)",
  boxShadow: "0 8px 20px rgba(0,0,0,.35)",
});

const bannerInfoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minWidth: 0,
};

const nameTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
  letterSpacing: 1.2,
  lineHeight: 1.1,
  maxWidth: "min(820px, 70vw)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const premiumBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  background: "rgba(255,255,255,.10)",
  border: "1px solid rgba(255,255,255,.18)",
};

const statusPillStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  background: active ? "rgba(74,222,128,.14)" : "rgba(251,113,133,.14)",
  border: `1px solid ${active ? "rgba(74,222,128,.28)" : "rgba(251,113,133,.28)"}`,
  color: "rgba(255,255,255,.92)",
});

const dynamicStatsBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  padding: "14px 18px",
  background: "rgba(255,255,255,.85)",
  borderBottom: "1px solid rgba(0,0,0,.06)",
};

const statColumnStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: "12px 14px",
  border: "1px solid rgba(0,0,0,.06)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.70))",
  boxShadow: "0 10px 30px rgba(0,0,0,.06)",
};

const statLabelContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  fontWeight: 900,
  color: "rgba(2,6,23,.60)",
  letterSpacing: 0.5,
};

const statValueStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 900,
  color: "rgba(2,6,23,.88)",
};

const errorAlertStyle: React.CSSProperties = {
  margin: "14px 18px 0",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(248,113,113,.35)",
  background: "rgba(248,113,113,.10)",
  color: "rgba(127,29,29,.92)",
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontWeight: 800,
  fontSize: 12,
};

const mainContentGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.05fr .95fr",
  gap: 16,
  padding: 18,
};

const contentPanel: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.86)",
  boxShadow: "0 14px 40px rgba(0,0,0,.06)",
  padding: 16,
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.8,
  color: "rgba(2,6,23,.78)",
  borderLeft: "4px solid rgba(255,122,24,.85)",
  paddingLeft: 10,
};

const minimalEditBtn: React.CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.08)",
  background: "rgba(2,6,23,.04)",
  fontSize: 12,
  fontWeight: 900,
  color: "rgba(2,6,23,.78)",
  cursor: "pointer",
};

const infoGridModern: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const infoTileStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.78)",
};

const tileIconBox: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(255,122,24,.10)",
  border: "1px solid rgba(255,122,24,.18)",
  color: "rgba(2,6,23,.80)",
  flex: "0 0 auto",
};

const tileLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "rgba(2,6,23,.55)",
  letterSpacing: 0.4,
};

const tileValue: React.CSSProperties = {
  marginTop: 3,
  fontSize: 13,
  fontWeight: 900,
  color: "rgba(2,6,23,.88)",
  wordBreak: "break-word",
};

const actionRowContainer: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const secondaryActionBtn = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.08)",
  background: active ? "rgba(251,113,133,.10)" : "rgba(74,222,128,.10)",
  color: "rgba(2,6,23,.86)",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
});

const dangerActionBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(248,113,113,.22)",
  background: "rgba(248,113,113,.10)",
  color: "rgba(127,29,29,.92)",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};

const paymentPendingStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,122,24,.22)",
  background: "linear-gradient(180deg, rgba(255,122,24,.10), rgba(255,255,255,.80))",
  padding: 14,
};

const paymentDoneStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(74,222,128,.24)",
  background: "linear-gradient(180deg, rgba(74,222,128,.10), rgba(255,255,255,.80))",
  padding: 14,
};

const paymentHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const paymentTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.75)",
};

const paymentAmount: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 900,
  color: "rgba(2,6,23,.88)",
};

const paymentActionGroup: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const modernSelect: React.CSSProperties = {
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.86)",
  outline: "none",
};

const modernDateInput: React.CSSProperties = {
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  fontWeight: 900,
  fontSize: 12,
  color: "rgba(2,6,23,.86)",
  outline: "none",
};

const primaryValidateBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,122,24,.25)",
  background: "linear-gradient(135deg, rgba(255,122,24,1), rgba(255,190,64,.95))",
  color: "#111827",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(255,122,24,.20)",
};

const successMessageContainer: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(74,222,128,.24)",
  background: "rgba(74,222,128,.10)",
  color: "rgba(2,6,23,.86)",
  display: "flex",
  gap: 10,
  alignItems: "center",
  fontWeight: 900,
};

const paidNoteStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px dashed rgba(0,0,0,.12)",
  background: "rgba(2,6,23,.02)",
  color: "rgba(2,6,23,.72)",
  fontSize: 12,
  fontWeight: 800,
};

const receiptPrintBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  color: "rgba(2,6,23,.86)",
  fontWeight: 900,
  cursor: "pointer",
};

const receiptIconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.88)",
  cursor: "pointer",
};

const printActionBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.06)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.78))",
  boxShadow: "0 14px 40px rgba(0,0,0,.06)",
  cursor: "pointer",
};

const printIconWrapper: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(59,130,246,.10)",
  border: "1px solid rgba(59,130,246,.18)",
  color: "rgba(2,6,23,.86)",
  flex: "0 0 auto",
};

const emptyStateContainer: React.CSSProperties = {
  borderRadius: 18,
  border: "1px dashed rgba(0,0,0,.12)",
  background: "rgba(2,6,23,.02)",
  padding: 18,
  display: "grid",
  placeItems: "center",
  gap: 10,
};

const createBtnStyle: React.CSSProperties = {
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,122,24,.25)",
  background: "linear-gradient(135deg, rgba(255,122,24,1), rgba(255,190,64,.95))",
  color: "#111827",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const footerArea: React.CSSProperties = {
  padding: "0 18px 18px",
};

const footerToggleBtn = (open: boolean): React.CSSProperties => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "12px 14px",
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.08)",
  background: open ? "rgba(255,122,24,.10)" : "rgba(2,6,23,.04)",
  color: "rgba(2,6,23,.86)",
  fontWeight: 900,
  cursor: "pointer",
});

const collapsibleWrapper: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 18,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.86)",
  padding: 12,
  boxShadow: "0 14px 40px rgba(0,0,0,.06)",
};

// =========================
// ✅ ReceiptModal styles
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
  width: "min(560px, 96vw)",
  borderRadius: 18,
  background: "rgba(255,255,255,.95)",
  border: "1px solid rgba(0,0,0,.08)",
  boxShadow: "0 20px 70px rgba(0,0,0,.30)",
  padding: 14,
};

const receiptCloseBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(2,6,23,.04)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const receiptBody: React.CSSProperties = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.86)",
  padding: 12,
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
  gap: 10,
};

const receiptBox: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.06)",
  background: "rgba(255,255,255,.86)",
  padding: 10,
};

const receiptK: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.6,
  color: "rgba(2,6,23,.55)",
  textTransform: "uppercase",
};

const receiptV: React.CSSProperties = {
  marginTop: 5,
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
  borderRadius: 14,
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
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,122,24,.25)",
  background: "linear-gradient(135deg, rgba(255,122,24,1), rgba(255,190,64,.95))",
  color: "#111827",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 16px 40px rgba(255,122,24,.20)",
};

const receiptBtnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.92)",
  color: "rgba(2,6,23,.86)",
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};
