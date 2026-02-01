import { api } from "./api";
import type { Category } from "./categories";
import type { Student } from "./students";

/* ============================
   TYPES
   ============================ */

export type EnrollmentStatus = "active" | "paused" | "ended";

export type PaymentMethod = "cash" | "card" | "yape" | "plin" | "transfer";

export type Enrollment = {
  id: number;
  student_id: number;
  category_id: number;

  starts_on: string | null;
  ends_on: string | null;

  status: EnrollmentStatus;

  // ✅ crédito (backend)
  billing_day?: number | null;
  plan_total_cents?: number | null;
  installments_count?: number | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Si backend hace ->with(['student','category'])
  student?: Pick<Student, "id" | "first_name" | "last_name" | "email" | "phone">;
  category?: Pick<Category, "id" | "name" | "level"> & {
    monthly_fee_cents?: number;
  };
};

export type Paginator<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type ListEnrollmentsParams = {
  studentId?: number;
  categoryId?: number;
  status?: EnrollmentStatus | "";
  page?: number;
  perPage?: number;
};

export type EnrollmentCreatePayload = {
  student_id: number;
  category_id: number;
  starts_on?: string | null;
  ends_on?: string | null;
  status?: EnrollmentStatus;
};

export type EnrollmentUpdatePayload = {
  starts_on?: string | null;
  ends_on?: string | null;
  status?: EnrollmentStatus;
};

/* ============================
   ENROLLMENTS CRUD
   ============================ */

export async function listEnrollments(params: ListEnrollmentsParams): Promise<Paginator<Enrollment>> {
  const res = await api.get<Paginator<Enrollment>>("/api/enrollments", {
    params: {
      student_id: params.studentId,
      category_id: params.categoryId,
      status: params.status || undefined,
      page: params.page ?? 1,
      per_page: params.perPage ?? 50,
    },
  });
  return res.data;
}

export async function createEnrollment(payload: EnrollmentCreatePayload): Promise<Enrollment> {
  const res = await api.post<{ data: Enrollment }>("/api/enrollments", payload);
  return res.data.data;
}

export async function updateEnrollment(id: number, payload: EnrollmentUpdatePayload): Promise<Enrollment> {
  const res = await api.put<{ data: Enrollment }>(`/api/enrollments/${id}`, payload);
  return res.data.data;
}

export async function deleteEnrollment(id: number): Promise<void> {
  await api.delete(`/api/enrollments/${id}`);
}

/* ============================
   CREDIT / CUOTAS
   POST /api/enrollments/{id}/credit
   ============================ */

export type EnrollmentCreditPayload = {
  plan_total_cents: number; // total del crédito (centavos)
  installments_count: number; // cuotas
  billing_day: number; // día del mes 1..28
};

export type ChargeStatus = "unpaid" | "partial" | "paid" | "void";

export type Charge = {
  id: number;
  student_id: number;
  enrollment_id: number;
  category_id: number | null;

  concept: "installment" | "initial_payment" | string;

  period_start: string; // YYYY-MM-DD
  due_on: string; // YYYY-MM-DD

  amount_cents: number;
  paid_cents: number;
  status: ChargeStatus;

  // ✅ (backend) cuando pagas
  paid_on?: string | null; // YYYY-MM-DD (tu backend lo guarda así)
  method?: PaymentMethod | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SaveCreditResponse = {
  enrollment: Enrollment;
  charges: Charge[];
};

export async function saveEnrollmentCredit(
  enrollmentId: number,
  payload: EnrollmentCreditPayload
): Promise<SaveCreditResponse> {
  const res = await api.post<{ data: SaveCreditResponse }>(
    `/api/enrollments/${enrollmentId}/credit`,
    payload
  );
  return res.data.data;
}

/* ============================
   CUOTAS (LISTAR / PAGAR)
   GET /api/enrollments/{id}/installments
   POST /api/installments/{chargeId}/pay
   ============================ */

export async function listInstallments(enrollmentId: number): Promise<Charge[]> {
  const res = await api.get<{ data: Charge[] }>(`/api/enrollments/${enrollmentId}/installments`);
  return res.data.data;
}

export type PayInstallmentPayload = {
  method: PaymentMethod;
  paid_on?: string; // YYYY-MM-DD
  paid_cents?: number; // si no mandas, paga completo
};

export async function payInstallment(
  installmentChargeId: number,
  payload: PayInstallmentPayload
): Promise<Charge> {
  const res = await api.post<{ data: Charge }>(`/api/installments/${installmentChargeId}/pay`, payload);
  return res.data.data;
}

/* ============================
   PAGO INICIAL REAL
   GET/POST /api/enrollments/{id}/initial-payment
   ============================ */

export type InitialPaymentResponse = Charge; // concept=initial_payment

export async function getInitialPayment(enrollmentId: number): Promise<InitialPaymentResponse> {
  const res = await api.get<{ data: InitialPaymentResponse }>(`/api/enrollments/${enrollmentId}/initial-payment`);
  return res.data.data;
}

/**
 * ✅ TS enforcing:
 * - si paid=true => method requerido
 * - si paid=false => method opcional (backend lo ignorará)
 */
export type SaveInitialPaymentPayload =
  | {
      paid: true;
      method: PaymentMethod;
      paid_on?: string; // YYYY-MM-DD
    }
  | {
      paid: false;
      method?: PaymentMethod;
      paid_on?: string; // YYYY-MM-DD
    };

export async function saveInitialPayment(
  enrollmentId: number,
  payload: SaveInitialPaymentPayload
): Promise<InitialPaymentResponse> {
  const res = await api.post<{ data: InitialPaymentResponse }>(`/api/enrollments/${enrollmentId}/initial-payment`, payload);
  return res.data.data;
}
