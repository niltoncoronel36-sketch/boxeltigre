import { api } from "./api";

export async function getStudentCurrent() {
  const res = await api.get("/api/student/me");

  return res.data.data;
}
