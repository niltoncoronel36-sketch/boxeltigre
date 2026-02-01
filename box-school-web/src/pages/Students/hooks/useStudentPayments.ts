import { useEffect, useState } from "react";
import { getMyPayments, type StudentPayments } from "../../../services/studentPayments";

export function useStudentPayments() {
  const [data, setData] = useState<StudentPayments | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPayments()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
