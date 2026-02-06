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

  billing_day?: number | null;
  plan_total_cents?: number | null;
  installments_count?: number | null;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  student?: Pick<Student, "id" | "first_name" | "last_name" | "email" | "phone">;
  category?: Pick<Category, "id" | "name" | "level"> & { monthly_fee_cents?: number };
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
  const res = await api.get<Paginator<Enrollment>>("/enrollments", {
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
  const res = await api.post<{ data: Enrollment }>("/enrollments", payload);
  return res.data.data;
}

export async function updateEnrollment(id: number, payload: EnrollmentUpdatePayload): Promise<Enrollment> {
  const res = await api.put<{ data: Enrollment }>(`/enrollments/${id}`, payload);
  return res.data.data;
}

export async function deleteEnrollment(id: number): Promise<void> {
  await api.delete(`/enrollments/${id}`);
}

/* ============================
   CREDIT / CUOTAS
   POST /enrollments/{id}/credit
   ============================ */

export type EnrollmentCreditPayload = {
  plan_total_cents: number;
  installments_count: number;
  billing_day: number; // 1..28
};

export type ChargeStatus = "unpaid" | "partial" | "paid" | "void";

export type Charge = {
  id: number;
  student_id: number;
  enrollment_id: number;
  category_id: number | null;

  concept: "installment" | "initial_payment" | string;

  period_start: string;
  due_on: string;

  amount_cents: number;
  paid_cents: number;
  status: ChargeStatus;

  paid_on?: string | null;
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
  const res = await api.post<{ data: SaveCreditResponse }>(`/enrollments/${enrollmentId}/credit`, payload);
  return res.data.data;
}

/* ============================
   CUOTAS (LISTAR / PAGAR)
   GET /enrollments/{id}/installments
   POST /installments/{chargeId}/pay
   ============================ */

export async function listInstallments(enrollmentId: number): Promise<Charge[]> {
  const res = await api.get<{ data: Charge[] }>(`/enrollments/${enrollmentId}/installments`);
  return res.data.data;
}

export type PayInstallmentPayload = {
  method: PaymentMethod;
  paid_on?: string;
  paid_cents?: number;
};

export async function payInstallment(installmentChargeId: number, payload: PayInstallmentPayload): Promise<Charge> {
  const res = await api.post<{ data: Charge }>(`/installments/${installmentChargeId}/pay`, payload);
  return res.data.data;
}

/* ============================
   PAGO INICIAL REAL
   GET/POST /enrollments/{id}/initial-payment
   ============================ */

export type InitialPaymentResponse = Charge;

export async function getInitialPayment(enrollmentId: number): Promise<InitialPaymentResponse> {
  const res = await api.get<{ data: InitialPaymentResponse }>(`/enrollments/${enrollmentId}/initial-payment`);
  return res.data.data;
}

export type SaveInitialPaymentPayload =
  | { paid: true; method: PaymentMethod; paid_on?: string }
  | { paid: false; method?: PaymentMethod; paid_on?: string };

export async function saveInitialPayment(
  enrollmentId: number,
  payload: SaveInitialPaymentPayload
): Promise<InitialPaymentResponse> {
  const res = await api.post<{ data: InitialPaymentResponse }>(`/enrollments/${enrollmentId}/initial-payment`, payload);
  return res.data.data;
}
