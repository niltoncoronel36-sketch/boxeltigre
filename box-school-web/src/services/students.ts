import { api } from "./api";

export type Student = {
  id: number;
  user_id: number | null;

  first_name: string;
  last_name: string;
  birthdate: string | null;

  document_type: string | null;
  document_number: string | null;

  phone: string | null;
  email: string | null;

  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  enrollments?: any[];
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

export type ListStudentsParams = {
  search?: string;
  active?: "1" | "0" | "";
  page?: number;
  perPage?: number;
};

export type StudentPayload = Partial<
  Pick<
    Student,
    | "user_id"
    | "first_name"
    | "last_name"
    | "birthdate"
    | "document_type"
    | "document_number"
    | "phone"
    | "email"
    | "emergency_contact_name"
    | "emergency_contact_phone"
    | "is_active"
  >
>;

export async function listStudents(params: ListStudentsParams): Promise<Paginator<Student>> {
  const res = await api.get<Paginator<Student>>("/students", {
    params: {
      search: params.search || "",
      active: params.active ?? "",
      page: params.page ?? 1,
      per_page: params.perPage ?? 15,
    },
  });
  return res.data;
}

export async function createStudent(payload: StudentPayload): Promise<Student> {
  const res = await api.post<{ data: Student }>("/students", payload);
  return res.data.data;
}

export async function updateStudent(id: number, payload: StudentPayload): Promise<Student> {
  const res = await api.put<{ data: Student }>(`/students/${id}`, payload);
  return res.data.data;
}

export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/students/${id}`);
}

/* ============================
   ✅ CREAR USUARIO PARA ALUMNO
   ============================ */

export type CreateStudentUserResponse = {
  user: {
    id: number;
    name: string;
    username: string; // DNI
  };
};

export async function createStudentUser(studentId: number): Promise<CreateStudentUserResponse> {
  const res = await api.post<{ data: CreateStudentUserResponse }>(`/students/${studentId}/create-user`);
  return res.data.data;
}

/* ============================
   ✅ OBTENER UN ESTUDIANTE (DETALLE)
   ============================ */

export async function getStudent(studentId: number): Promise<Student> {
  const res = await api.get(`/students/${studentId}`);
  return (res.data?.data ?? res.data) as Student;
}
