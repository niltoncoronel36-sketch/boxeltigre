import { api } from "./api";

export type StudentInstallment = {
  id: number;
  number: number;
  amount: number;
  due_date: string;
  paid_at: string | null;
};

export type StudentPayments = {
  plan: { name: string; level: string };
  total: number;
  paid: number;
  pending: number;
  installments: StudentInstallment[];
};

export async function getMyPayments() {
  const { data } = await api.get<{ data: StudentPayments | null }>(
    "/api/student/payments"
  );
  return data.data;
}
