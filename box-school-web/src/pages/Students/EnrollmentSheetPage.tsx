import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import EnrollmentSheet from "./components/EnrollmentSheet";

import type { Student } from "../../services/students";
import { getStudent } from "../../services/students";

import type { Enrollment } from "../../services/enrollments";
import { listEnrollments, getInitialPayment } from "../../services/enrollments";

import type { Category } from "../../services/categories";
import { listActiveCategories } from "../../services/categories";

type PaymentsSummary = {
  monthly_fee_cents?: number;
  initial_amount_cents?: number;

  initial_paid?: boolean;
  initial_paid_on?: string | null;
  initial_method?: string | null;
};

function pickCurrentEnrollment(list: Enrollment[]): Enrollment | null {
  if (!Array.isArray(list) || list.length === 0) return null;

  // 1) Preferimos active
  const actives = list.filter((e) => e.status === "active");
  const base = actives.length ? actives : list;

  // 2) Ordenamos por starts_on desc y luego id desc
  const sorted = base.slice().sort((a, b) => {
    const ad = a.starts_on ?? "";
    const bd = b.starts_on ?? "";
    if (ad !== bd) return bd.localeCompare(ad);
    return (b.id ?? 0) - (a.id ?? 0);
  });

  return sorted[0] ?? null;
}

export default function EnrollmentSheetPage() {
  const params = useParams();
  const studentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [student, setStudent] = useState<Student | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<PaymentsSummary | null>(null);

  useEffect(() => {
    if (!studentId || Number.isNaN(studentId)) {
      setErr("ID de estudiante inválido.");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const [st, enrRes, cats] = await Promise.all([
          getStudent(studentId),
          listEnrollments({ studentId, perPage: 50 }),
          listActiveCategories(),
        ]);

        if (!alive) return;

        setStudent(st);
        setCategories(cats);

        const current = pickCurrentEnrollment(enrRes.data);
        setEnrollment(current);

        // -------- Pagos ----------
        const feeFromEnrollment =
          current?.category?.monthly_fee_cents ??
          cats.find((c) => c.id === current?.category_id)?.monthly_fee_cents ??
          null;

        const summary: PaymentsSummary = {
          monthly_fee_cents: feeFromEnrollment ?? undefined,
        };

        // pago inicial real:
        if (current?.id) {
          try {
            const ch = await getInitialPayment(current.id);

            // status puede ser paid/unpaid/partial/void
            const paid =
              String(ch.status) === "paid" ||
              (Number(ch.paid_cents ?? 0) >= Number(ch.amount_cents ?? 0) &&
                Number(ch.amount_cents ?? 0) > 0);

            summary.initial_amount_cents = ch.amount_cents ?? undefined;
            summary.initial_paid = paid;
            summary.initial_paid_on = ch.paid_on ?? null;
            summary.initial_method = (ch.method as any) ?? null;
          } catch {
            summary.initial_paid = false;
          }
        }

        setPayments(summary);
      } catch (e: any) {
        if (!alive) return;
        setErr("No se pudo cargar la ficha (revisa sesión / API).");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [studentId]);

  // ✅ Datos reales sacados de PublicContact
  const club = useMemo(
    () => ({
      name: 'CLUB DE BOX "EL TIGRE"',
      city: "Huancayo, Perú",
      address: "—",
      phone: "—",
      whatsapp: "51947637782", // ✅ sin espacios
      facebook: "@eltigrebox",
      tiktok: "@eltigrebox",
      website: "—",
    }),
    []
  );

  if (loading) {
    return (
      <div className="card" style={{ margin: 16 }}>
        Cargando ficha...
      </div>
    );
  }

  if (err || !student) {
    return (
      <div className="card" style={{ margin: 16 }}>
        {err ?? "No se encontró el estudiante."}
      </div>
    );
  }

  return (
    <EnrollmentSheet
      student={student}
      enrollment={enrollment}
      payments={payments}
      club={club}
    />
  );
}
