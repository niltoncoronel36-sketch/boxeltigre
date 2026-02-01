import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type StoreCategory = { id: number; name: string; slug: string };

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  is_active: boolean;
  total_stock: number;
  category?: StoreCategory | null;
  image?: string | null; // ✅ por si el backend lo manda
};

type FormState = {
  id?: number;
  name: string;
  brand: string;
  price: string;
  compare_at_price: string;
  product_category_id: string; // select
  is_active: boolean;

  // ✅ NUEVO
  total_stock: string; // input
};

function money(n: number) {
  return `S/ ${Number(n || 0).toFixed(2)}`;
}

export default function StorePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cats, setCats] = useState<StoreCategory[]>([]);
  const [items, setItems] = useState<AdminProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all"); // slug o all
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [stock, setStock] = useState<"all" | "in" | "out">("all");

  // modal create/edit
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    brand: "El Tigre",
    price: "0",
    compare_at_price: "",
    product_category_id: "",
    is_active: true,

    // ✅ NUEVO
    total_stock: "0",
  });

  // ✅ imagen opcional
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      name: "",
      brand: "El Tigre",
      price: "0",
      compare_at_price: "",
      product_category_id: "",
      is_active: true,

      total_stock: "0",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const pickList = (res: any) => {
    const raw = res?.data?.data;
    return (
      (Array.isArray(raw?.items) && raw.items) ||
      (Array.isArray(raw?.items?.data) && raw.items.data) ||
      (Array.isArray(raw?.data) && raw.data) ||
      (Array.isArray(raw) && raw) ||
      []
    );
  };

  const loadAll = async () => {
    setError(null);
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get("/api/product-categories"),
        api.get("/api/products", { params: { per_page: 200, include_inactive: 1 } })

      ]);

      const categories = Array.isArray(catRes.data?.data) ? catRes.data.data : [];
      const list = pickList(prodRes);

      setCats(categories);
      setItems(list);
    } catch {
      setError("No se pudo cargar la tienda (revisa sesión / API).");
      setCats([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return items.filter((p) => {
      const matchQ =
        !qq ||
        p.name?.toLowerCase().includes(qq) ||
        (p.brand ?? "").toLowerCase().includes(qq) ||
        p.slug?.toLowerCase().includes(qq);

      const matchCat = cat === "all" ? true : p.category?.slug === cat;

      const matchActive =
        active === "all" ? true : active === "active" ? p.is_active : !p.is_active;

      const matchStock =
        stock === "all" ? true : stock === "in" ? p.total_stock > 0 : p.total_stock <= 0;

      return matchQ && matchCat && matchActive && matchStock;
    });
  }, [items, q, cat, active, stock]);

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setForm({
      id: p.id,
      name: p.name ?? "",
      brand: p.brand ?? "El Tigre",
      price: String(p.price ?? 0),
      compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
      product_category_id: p.category?.id ? String(p.category.id) : "",
      is_active: !!p.is_active,

      // ✅ NUEVO
      total_stock: String(p.total_stock ?? 0),
    });

    setImageFile(null);
    setImagePreview(p.image ?? null);

    setOpen(true);
  };

  const onPickImage = (file: File | null) => {
    setImageFile(file);
    if (!file) {
      if (!form.id) setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const name = form.name.trim();
      if (!name) {
        setError("El nombre es obligatorio.");
        setSaving(false);
        return;
      }

      // ✅ multipart/form-data (foto opcional)
      const fd = new FormData();
      fd.append("name", name);
      fd.append("brand", (form.brand || "El Tigre").trim());
      fd.append("price", String(Number(form.price || 0)));
      if (form.compare_at_price) fd.append("compare_at_price", String(Number(form.compare_at_price)));
      if (form.product_category_id) fd.append("product_category_id", form.product_category_id);
      fd.append("is_active", form.is_active ? "1" : "0");

      // ✅ NUEVO: stock total
      // (si tu backend espera otro nombre, aquí lo cambiamos)
      fd.append("total_stock", String(Math.max(0, Number(form.total_stock || 0))));

      // foto opcional
      if (imageFile) fd.append("image", imageFile);

      if (form.id) {
        fd.append("_method", "PUT");
        await api.post(`/api/products/${form.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/api/products`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setOpen(false);
      await loadAll();
    } catch {
      setError("No se pudo guardar. Verifica endpoints admin y permisos.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: AdminProduct) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    setError(null);

    try {
      await api.delete(`/api/products/${p.id}`);
      await loadAll();
    } catch {
      setError("No se pudo eliminar (verifica endpoint admin y permisos).");
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Tienda (Admin)</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>Gestión de productos, stock y catálogo.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={loadAll} disabled={loading}>
            Recargar
          </button>
          <button className="btn btn-primary" onClick={openCreate}>
            + Nuevo producto
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #ff6a0033" }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
        <input
          placeholder="Buscar por nombre, marca o slug..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
        />

        <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
          <option value="all">Todas</option>
          {cats.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select value={active} onChange={(e) => setActive(e.target.value as any)} style={{ padding: 10, borderRadius: 10 }}>
          <option value="all">Activos + Inactivos</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>

        <select value={stock} onChange={(e) => setStock(e.target.value as any)} style={{ padding: 10, borderRadius: 10 }}>
          <option value="all">Stock: todos</option>
          <option value="in">Con stock</option>
          <option value="out">Sin stock</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ marginTop: 14, overflow: "auto" }}>
        {loading ? (
          <div style={{ padding: 12 }}>Cargando...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(0,0,0,.12)" }}>
                <th style={{ padding: 10 }}>Producto</th>
                <th style={{ padding: 10 }}>Categoría</th>
                <th style={{ padding: 10 }}>Precio</th>
                <th style={{ padding: 10 }}>Stock</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10, width: 260 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div
                        style={{
                          width: 46,
                          height: 34,
                          borderRadius: 8,
                          border: "1px solid rgba(0,0,0,.12)",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundImage: p.image ? `url(${p.image})` : "none",
                          backgroundColor: p.image ? "transparent" : "rgba(0,0,0,.04)",
                        }}
                        title={p.image ? "Imagen" : "Sin imagen"}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>{p.category?.name ?? "—"}</td>
                  <td style={{ padding: 10 }}>
                    {money(p.price)}{" "}
                    {p.compare_at_price ? (
                      <span style={{ fontSize: 12, opacity: 0.65, textDecoration: "line-through", marginLeft: 8 }}>
                        {money(p.compare_at_price)}
                      </span>
                    ) : null}
                  </td>
                  <td style={{ padding: 10 }}>{p.total_stock}</td>
                  <td style={{ padding: 10 }}>{p.is_active ? "Activo" : "Inactivo"}</td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => openEdit(p)}>
                        Editar
                      </button>
                      <button className="btn" onClick={() => alert("Stock por variante: siguiente paso (talla/color/oz)")}>
                        Stock
                      </button>
                      <button className="btn btn-danger" onClick={() => remove(p)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.8 }}>
                    No hay productos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Create/Edit */}
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
          <div className="card" style={{ width: "min(760px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{form.id ? "Editar producto" : "Nuevo producto"}</h3>

            <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
              {/* Foto opcional */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 800 }}>Foto (opcional)</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  disabled={saving}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: 200,
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,.15)",
                    }}
                  />
                )}
                <div style={{ fontSize: 12, opacity: 0.7 }}>Si no subes foto, el producto se guarda igual.</div>
              </div>

              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr" }}>
                <input
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Nombre del producto"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                  disabled={saving}
                />

                <select
                  value={form.product_category_id}
                  onChange={(e) => setForm((s) => ({ ...s, product_category_id: e.target.value }))}
                  style={{ padding: 10, borderRadius: 10 }}
                  disabled={saving}
                >
                  <option value="">Sin categoría</option>
                  {cats.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
                <input
                  value={form.brand}
                  onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))}
                  placeholder="Marca (El Tigre)"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                  disabled={saving}
                />

                <input
                  value={form.price}
                  onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                  placeholder="Precio (ej: 159)"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                  disabled={saving}
                />

                <input
                  value={form.compare_at_price}
                  onChange={(e) => setForm((s) => ({ ...s, compare_at_price: e.target.value }))}
                  placeholder="Antes (opcional)"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                  disabled={saving}
                />
              </div>

              {/* ✅ NUEVO: STOCK TOTAL */}
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <input
                  value={form.total_stock}
                  onChange={(e) => setForm((s) => ({ ...s, total_stock: e.target.value }))}
                  placeholder="Stock total (ej: 25)"
                  style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                  disabled={saving}
                />

                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((s) => ({ ...s, is_active: e.target.checked }))}
                    disabled={saving}
                  />
                  Producto activo (visible en tienda pública)
                </label>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn" type="button" onClick={() => setOpen(false)} disabled={saving}>
                  Cancelar
                </button>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>

              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Nota: la gestión de <b>stock por variante</b> (talla/color/oz) la hacemos en el siguiente paso.
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
