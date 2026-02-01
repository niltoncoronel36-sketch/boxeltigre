// src/pages/Categories.tsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Category = {
  id: number;
  name: string;
  level: string | null;
  min_age: number | null;
  max_age: number | null;
  capacity: number | null;
  monthly_fee_cents: number | null;
  is_active: boolean;
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type FormErrors = Record<string, string[]>;

function moneyFromCents(cents?: number | null) {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}

function centsFromSoles(input: string) {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function solesFromCents(cents?: number | null) {
  const v = (cents ?? 0) / 100;
  return (Math.round(v * 100) / 100).toFixed(2);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.04)",
  color: "rgba(255,255,255,.92)",
  outline: "none",
};

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{props.label}</div>
      <div style={{ marginTop: 6 }}>{props.children}</div>
      {props.error && (
        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,150,150,.95)" }}>{props.error}</div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [active, setActive] = useState<"all" | "1" | "0">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    name: "",
    level: "",
    min_age: "",
    max_age: "",
    capacity: "",
    monthly_fee_soles: "0.00",
    is_active: true,
  });

  const params = useMemo(() => {
    const p: Record<string, any> = { page, per_page: perPage };
    if (search.trim()) p.search = search.trim();
    if (active !== "all") p.active = active;
    return p;
  }, [page, perPage, search, active]);

  async function fetchCategories() {
    setLoading(true);
    setServerError(null);

    try {
      const res = await api.get<Paginator<Category>>("/api/categories", { params });
      setItems(res.data.data ?? []);
      setPage(res.data.current_page ?? 1);
      setLastPage(res.data.last_page ?? 1);
      setPerPage(res.data.per_page ?? perPage);
      setTotal(res.data.total ?? 0);
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "Error cargando categorías.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function resetForm() {
    setErrors({});
    setForm({
      name: "",
      level: "",
      min_age: "",
      max_age: "",
      capacity: "",
      monthly_fee_soles: "0.00",
      is_active: true,
    });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setErrors({});
    setForm({
      name: cat.name ?? "",
      level: cat.level ?? "",
      min_age: cat.min_age == null ? "" : String(cat.min_age),
      max_age: cat.max_age == null ? "" : String(cat.max_age),
      capacity: cat.capacity == null ? "" : String(cat.capacity),
      monthly_fee_soles: solesFromCents(cat.monthly_fee_cents),
      is_active: !!cat.is_active,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
    setErrors({});
  }

  function payload() {
    return {
      name: form.name.trim(),
      level: form.level.trim() ? form.level.trim() : null,
      min_age: form.min_age === "" ? null : Number(form.min_age),
      max_age: form.max_age === "" ? null : Number(form.max_age),
      capacity: form.capacity === "" ? null : Number(form.capacity),
      monthly_fee_cents: centsFromSoles(form.monthly_fee_soles),
      is_active: !!form.is_active,
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setServerError(null);
    setErrors({});

    try {
      const data = payload();
      if (!data.name) {
        setErrors({ name: ["El nombre es obligatorio."] });
        return;
      }

      if (editing) {
        await api.put(`/api/categories/${editing.id}`, data);
      } else {
        await api.post(`/api/categories`, data);
        setPage(1);
      }

      await fetchCategories();
      closeModal();
    } catch (e: any) {
      if (e?.response?.status === 422) {
        setErrors(e.response.data?.errors ?? {});
        setServerError(e.response.data?.message ?? "Validación falló.");
      } else {
        setServerError(e?.response?.data?.message ?? "No se pudo guardar.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: Category) {
    const next = !cat.is_active;

    // UI optimista
    setItems((prev) => prev.map((x) => (x.id === cat.id ? { ...x, is_active: next } : x)));

    try {
      // ✅ Mejor PATCH para cambios parciales
      await api.patch(`/api/categories/${cat.id}`, { is_active: next });
    } catch (e: any) {
      // rollback
      setItems((prev) => prev.map((x) => (x.id === cat.id ? { ...x, is_active: !next } : x)));
      setServerError(e?.response?.data?.message ?? "No se pudo cambiar el estado.");
    }
  }

  async function remove(cat: Category) {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;

    try {
      await api.delete(`/api/categories/${cat.id}`);
      if (items.length === 1 && page > 1) setPage(page - 1);
      await fetchCategories();
    } catch (e: any) {
      setServerError(e?.response?.data?.message ?? "No se pudo eliminar.");
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Categorías</h2>
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            Total: <b>{total}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o nivel..."
            style={{ ...inputStyle, minWidth: 240 }}
          />

          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value as any);
              setPage(1);
            }}
            style={inputStyle}
          >
            <option value="all">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>

          <button className="btn btn-primary" onClick={openCreate}>
            + Nueva
          </button>
        </div>
      </div>

      {serverError && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,45,45,.30)",
            background: "rgba(255,45,45,.10)",
          }}
        >
          {serverError}
        </div>
      )}

      <div style={{ marginTop: 14, overflowX: "auto", border: "1px solid rgba(255,255,255,.10)", borderRadius: 18 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "rgba(255,255,255,.05)" }}>
            <tr>
              {["Nombre", "Nivel", "Edad", "Capacidad", "Mensualidad", "Estado", "Acciones"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.10)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 14, opacity: 0.8 }}>
                  Cargando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 14, opacity: 0.8 }}>
                  No hay categorías.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid rgba(255,255,255,.10)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800 }}>{c.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>ID: {c.id}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{c.level ?? "—"}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {c.min_age ?? "—"} - {c.max_age ?? "—"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>{c.capacity ?? "—"}</td>
                  <td style={{ padding: "12px 14px" }}>{moneyFromCents(c.monthly_fee_cents)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button className="btn" onClick={() => toggleActive(c)} style={{ padding: "8px 10px" }}>
                      {c.is_active ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => openEdit(c)} style={{ padding: "8px 10px" }}>
                        Editar
                      </button>
                      <button
                        className="btn"
                        onClick={() => remove(c)}
                        style={{ padding: "8px 10px", borderColor: "rgba(255,45,45,.30)", background: "rgba(255,45,45,.10)" }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Página <b>{page}</b> de <b>{lastPage}</b>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            style={inputStyle}
          >
            {[10, 15, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/pág
              </option>
            ))}
          </select>

          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.5 : 1 }}>
            ←
          </button>
          <button className="btn" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))} style={{ opacity: page >= lastPage ? 0.5 : 1 }}>
            →
          </button>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.70)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="card" style={{ width: "min(720px, 100%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <h3 style={{ marginTop: 0 }}>{editing ? "Editar categoría" : "Nueva categoría"}</h3>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Guarda tus cambios.</div>
              </div>
              <button className="btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={save} style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <div className="grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <Field label="Nombre *" error={errors.name?.[0]}>
                  <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} />
                </Field>

                <Field label="Nivel (si vacío => general)" error={errors.level?.[0]}>
                  <input value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} style={inputStyle} />
                </Field>

                <Field label="Edad mínima" error={errors.min_age?.[0]}>
                  <input
                    value={form.min_age}
                    onChange={(e) => setForm((p) => ({ ...p, min_age: e.target.value.replace(/[^\d]/g, "") }))}
                    style={inputStyle}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Edad máxima" error={errors.max_age?.[0]}>
                  <input
                    value={form.max_age}
                    onChange={(e) => setForm((p) => ({ ...p, max_age: e.target.value.replace(/[^\d]/g, "") }))}
                    style={inputStyle}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Capacidad" error={errors.capacity?.[0]}>
                  <input
                    value={form.capacity}
                    onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value.replace(/[^\d]/g, "") }))}
                    style={inputStyle}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Mensualidad (S/)" error={errors.monthly_fee_cents?.[0]}>
                  <input
                    value={form.monthly_fee_soles}
                    onChange={(e) => setForm((p) => ({ ...p, monthly_fee_soles: e.target.value.replace(/[^\d.]/g, "") }))}
                    style={inputStyle}
                    inputMode="decimal"
                  />
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                    Guardará: <b>{moneyFromCents(centsFromSoles(form.monthly_fee_soles))}</b>
                  </div>
                </Field>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                Activa
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="btn" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
