export type ReportDateRange = { from: string; to: string };

export type ReportFilters = {
  from: string;        // YYYY-MM-DD
  to: string;          // YYYY-MM-DD
  category_id?: number | "";
  method?: string | "";
  status?: string | "";
  q?: string;
  group_by?: "day" | "month" | "category" | "method";
};

export type StatCard = { label: string; value: string; hint?: string };

export type FinanceRow = {
  id: number;
  paid_on?: string | null;
  method?: string | null;
  concept?: string | null;
  amount_cents?: number;
  paid_cents?: number;
  student_name?: string;
  document_number?: string;
  category_name?: string;
  enrollment_id?: number;
  receipt?: string; // NV...
};

export type InstallmentRow = {
  id: number;
  due_on: string;
  status: string;
  amount_cents: number;
  paid_cents?: number;
  paid_on?: string | null;
  method?: string | null;
  student_name?: string;
  document_number?: string;
  category_name?: string;
  enrollment_id?: number;
  days_late?: number;
};

export type StudentsRow = {
  student_id: number;
  student_name: string;
  document_number?: string | null;
  is_active?: boolean;
  category_name?: string | null;
  enrollment_status?: string | null;
  starts_on?: string | null;
  ends_on?: string | null;
};

export type AttendanceRow = {
  id: number;
  date: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
  student_name?: string;
  document_number?: string;
  category_name?: string;
};

export type StoreRow = {
  order_id: number;
  code: string;
  created_at?: string;
  status?: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  total_cents?: number;
};
