import { api } from "../../services/api";
import type {
  ReportFilters,
  FinanceRow,
  InstallmentRow,
  StudentsRow,
  AttendanceRow,
  StoreRow,
  StatCard,
} from "./types";

function toQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  return sp.toString();
}

async function get<T>(path: string, filters: ReportFilters) {
  const qs = toQuery(filters as any);
  const url = qs ? `${path}?${qs}` : path;
  const res = await api.get(url);
  // asume ApiResponse { success, data }
  return (res.data?.data ?? res.data) as T;
}

export const reportsApi = {
  financeSummary: (f: ReportFilters) => get<{ cards: StatCard[] }>("/api/reports/finance/summary", f),
  financeList: (f: ReportFilters) => get<{ rows: FinanceRow[] }>("/api/reports/finance/list", f),

  installmentsSummary: (f: ReportFilters) => get<{ cards: StatCard[] }>("/api/reports/installments/summary", f),
  installmentsList: (f: ReportFilters) => get<{ rows: InstallmentRow[] }>("/api/reports/installments/list", f),

  studentsSummary: (f: ReportFilters) => get<{ cards: StatCard[] }>("/api/reports/students/summary", f),
  studentsList: (f: ReportFilters) => get<{ rows: StudentsRow[] }>("/api/reports/students/list", f),

  attendanceSummary: (f: ReportFilters) => get<{ cards: StatCard[] }>("/api/reports/attendance/summary", f),
  attendanceList: (f: ReportFilters) => get<{ rows: AttendanceRow[] }>("/api/reports/attendance/list", f),

  storeSummary: (f: ReportFilters) => get<{ cards: StatCard[] }>("/api/reports/store/summary", f),
  storeList: (f: ReportFilters) => get<{ rows: StoreRow[] }>("/api/reports/store/list", f),
};
