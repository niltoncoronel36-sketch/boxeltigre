import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type StoreCategory = { id: number; name: string; slug: string };

type FormState = {
  id?: number;
  name: string;
  slug: string;
};

export default function StoreCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [items, setItems] = useState<StoreCategory[]>([]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", slug: "" });

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/product-categories");
      const arr = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(arr);
    } catch {
      setItems([]);
      setError("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return items;
    return items.filter((c) => c.name.toLowerCase().includes(qq) || c.slug.toLowerCase().includes(qq));
  }, [items, q]);

  const openCreate = () => {
    setForm({ name: "", slug: "" });
    setOpen(true);
  };

  const openEdit = (c: StoreCategory) => {
    setForm({ id: c.id, name: c.name, slug: c.slug });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
      };

      if (!payload.name) {
        setError("El nombre es obligatorio.");
        setSaving(false);
        return;
      }

      if (form.id) {
        await api.put(`/api/product-categories/${form.id}`, payload);
      } else {
        await api.post(`/api/product-categories`, payload);
      }

      setOpen(false);
      await loadAll();
    } catch {
      setError("No se pudo guardar la categoría (revisa sesión/permisos).");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: StoreCategory) => {
    if (!confirm(`¿Eliminar categoría "${c.name}"?`)) return;
    setError(null);
    try {
      await api.delete(`/api/product-categories/${c.id}`);
      await loadAll();
    } catch {
      setError("No se pudo eliminar (quizá tiene productos asociados).");
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Categorías (Tienda)</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Crea y gestiona categorías del catálogo.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={loadAll} disabled={loading}>Recargar</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva</button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #ff6a0033" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar categoría..."
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)", flex: 1 }}
        />
      </div>

      <div style={{ marginTop: 14, overflow: "auto" }}>
        {loading ? (
          <div style={{ padding: 12 }}>Cargando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(0,0,0,.12)" }}>
                <th style={{ padding: 10 }}>Nombre</th>
                <th style={{ padding: 10 }}>Slug</th>
                <th style={{ padding: 10, width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  <td style={{ padding: 10, fontWeight: 800 }}>{c.name}</td>
                  <td style={{ padding: 10, opacity: 0.8 }}>{c.slug}</td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-danger" onClick={() => remove(c)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 12, opacity: 0.8 }}>
                    No hay categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: "min(620px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? "Editar categoría" : "Nueva categoría"}</h3>

            <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Nombre (ej: Guantes)"
                style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                disabled={saving}
              />

              <input
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                placeholder="Slug (opcional, ej: guantes)"
                style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                disabled={saving}
              />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn" type="button" onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
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
