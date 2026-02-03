import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api"; // ✅ CAMBIO: usar el api con Bearer token
import {
  Layers,
  Users,
  BadgeDollarSign,
  Pencil,
  Trash2,
  Plus,
  Search,
  Filter,
} from "lucide-react";

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
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
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

// ✅ Ajustado a tema blanco (y corregido rgba)
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,.10)",
  background: "rgba(255,255,255,.96)",
  color: "rgba(14,14,14,.82)",
  outline: "none",
  boxShadow: "0 6px 16px rgba(0,0,0,.06)",
};

function Field(props: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{props.label}</div>
      <div style={{ marginTop: 6 }}>{props.children}</div>
      {props.error && (
        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(160,0,0,.85)" }}>
          {props.error}
        </div>
      )}
    </div>
  );
}

function LevelBadge({ level }: { level?: string | null }) {
  const label = (level ?? "").trim() || "general";
  return (
    <span className="cat-pill" title="Nivel">
      <Layers size={16} />
      {label}
    </span>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="cat-meta-row">
      <div className="cat-meta-ico">
        <Icon size={18} />
      </div>
      <div style={{ lineHeight: 1.15 }}>
        <div className="cat-meta-label">{label}</div>
        <div className="cat-meta-value">{value}</div>
      </div>
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
      await api.patch(`/api/categories/${cat.id}`, { is_active: next });
    } catch (e: any) {
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>Categorías</h2>
          <div style={{ opacity: 0.75, fontSize: 12 }}>
            Total: <b>{total}</b>
          </div>
        </div>

        <button className="btn btn-primary" onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} />
          Nueva
        </button>
      </div>

      {/* Filters */}
      <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 140px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 12, opacity: 0.55 }} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o nivel..."
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Filter size={16} style={{ position: "absolute", left: 12, top: 12, opacity: 0.55 }} />
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value as any);
              setPage(1);
            }}
            style={{ ...inputStyle, paddingLeft: 36 }}
          >
            <option value="all">Todas</option>
            <option value="1">Activas</option>
            <option value="0">Inactivas</option>
          </select>
        </div>

        <select
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
          style={inputStyle}
          title="Items por página"
        >
          {[10, 15, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/pág
            </option>
          ))}
        </select>
      </div>

      {serverError && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(255,45,45,.22)", background: "rgba(255,45,45,.08)" }}>
          {serverError}
        </div>
      )}

      {/* Cards */}
      <div className="cat-wrap">
        <div className="cat-grid">
          {loading ? (
            <div className="cat-card" style={{ opacity: 0.85 }}>
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="cat-card" style={{ opacity: 0.85 }}>
              No hay categorías.
            </div>
          ) : (
            items.map((c) => (
              <div key={c.id} className="cat-card">
                <div className="cat-card__top">
                  <div className="cat-icon" title="Categoría">
                    <Layers size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 className="cat-title" title={c.name}>
                          {c.name}
                        </h3>

                        <div className="cat-subrow">
                          <LevelBadge level={c.level} />
                          <span className="cat-id">ID: {c.id}</span>
                        </div>
                      </div>

                      {/* ✅ Switch deslizable */}
                      <label className="switch" title="Activar / desactivar">
                        <input type="checkbox" checked={!!c.is_active} onChange={() => toggleActive(c)} />
                        <span className="switch-track">
                          <span className="switch-thumb" />
                        </span>
                        <span className="switch-text">{c.is_active ? "Activa" : "Inactiva"}</span>
                      </label>
                    </div>

                    <div className="cat-meta">
                      <MetaRow icon={Users} label="Edad" value={`${c.min_age ?? "—"} - ${c.max_age ?? "—"}`} />
                      <MetaRow icon={Users} label="Capacidad" value={c.capacity ?? "—"} />
                      <MetaRow icon={BadgeDollarSign} label="Mensualidad" value={moneyFromCents(c.monthly_fee_cents)} />
                    </div>

                    <div className="cat-actions">
                      <button className="btn btn-sm" onClick={() => openEdit(c)} type="button">
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button className="btn btn-sm btn-danger" onClick={() => remove(c)} type="button">
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Página <b>{page}</b> de <b>{lastPage}</b>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.5 : 1 }}>
            ←
          </button>
          <button className="btn" disabled={page >= lastPage} onClick={() => setPage((p) => Math.min(lastPage, p + 1))} style={{ opacity: page >= lastPage ? 0.5 : 1 }}>
            →
          </button>
        </div>
      </div>

      {/* Modal */}
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
