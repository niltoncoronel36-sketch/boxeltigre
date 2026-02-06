import { api } from "./api";

export type AttendanceScanResponse = {
  success: boolean;
  message: string;
  action: "check_in" | "check_out" | "already_done";
  user?: { id: number; name: string; email: string; dni: string };
  attendance?: any;
};

export type AttendanceTodayItem = {
  id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  updated_at: string;
  user: { id: number; name: string; email: string; dni: string };
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

export async function scanAttendance(dni: string) {
  const clean = String(dni ?? "").trim().replace(/\s+/g, "");
  const { data } = await api.post<AttendanceScanResponse>("/attendance/scan", { dni: clean });
  return data;
}

export async function getTodayAttendances(params?: { search?: string; page?: number }) {
  const { data } = await api.get<{
    success: boolean;
    message: string;
    data: Paginated<AttendanceTodayItem>;
  }>("/attendance/today", { params });

  return data;
}

export async function getAttendanceHistory(params?: { search?: string; from?: string; to?: string; page?: number }) {
  const { data } = await api.get<{
    success: boolean;
    message: string;
    data: Paginated<AttendanceTodayItem>;
  }>("/attendance/history", { params });

  return data;
}

// ==============================
// ASISTENCIAS DEL ALUMNO
// ==============================

export type StudentAttendanceItem = {
  date: string;
  status: "present" | "late" | "absent";
  checked_at: string | null;
};

export async function getMyAttendance() {
  const { data } = await api.get<{ data: StudentAttendanceItem[] }>("/student/attendance");
  return data.data;
}
