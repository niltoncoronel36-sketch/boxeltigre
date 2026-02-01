import { useEffect, useState } from "react";
import { getStudentCurrent } from "../../../services/studentCurrent";

export function useStudentCurrent() {
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudentCurrent()
      .then(setStudent)
      .catch(() => setError("No se pudo cargar el alumno"))
      .finally(() => setLoading(false));
  }, []);

  return { student, loading, error };
}
