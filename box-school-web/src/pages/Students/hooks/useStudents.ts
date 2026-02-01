import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../services/api";
import type { Student, StudentPayload } from "../../../services/students";
import { createStudent, deleteStudent, listStudents, updateStudent } from "../../../services/students";

export function useStudents(perPage = 15) {
  const [items, setItems] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"1" | "0" | "">("1");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      search: search.trim(),
      active,
      page,
      perPage,
    }),
    [search, active, page, perPage]
  );

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const res = await listStudents(query);
      setItems(res.data);
      setTotal(res.total);
      setLastPage(res.last_page);
      setPage(res.current_page);
    } catch (e) {
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.active, query.page]);

  async function createOne(payload: StudentPayload) {
    return createStudent(payload);
  }

  async function updateOne(id: number, payload: Partial<StudentPayload>) {
    return updateStudent(id, payload as any);
  }

  async function deleteOne(id: number) {
    return deleteStudent(id);
  }

  return {
    // state
    items,
    total,
    page,
    lastPage,
    perPage,
    search,
    active,
    loading,
    err,

    // setters
    setPage,
    setSearch,
    setActive,
    setErr,

    // actions
    refresh,
    createOne,
    updateOne,
    deleteOne,
  };
}
