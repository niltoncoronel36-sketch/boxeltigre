import { useEffect, useState } from "react";
import { getMyAttendance, type StudentAttendanceItem } from "../../../services/attendance";

export function useStudentAttendance() {
  const [items, setItems] = useState<StudentAttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAttendance()
      .then(setItems)
      .catch(() => setError("No se pudieron cargar las asistencias"))
      .finally(() => setLoading(false));
  }, []);

  return { items, loading, error };
}
