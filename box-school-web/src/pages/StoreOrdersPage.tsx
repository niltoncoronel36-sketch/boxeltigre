// src/pages/StoreOrdersPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
type PaymentMethod = "cash" | "whatsapp" | "yape" | "gateway";

type StoreOrderLite = {
  id: number;
  code: string;
  customer_name: string | null;
  customer_phone: string;
  payment_method: PaymentMethod;
  status: OrderStatus;
  total: number;
  currency: string;
  items_count: number;
  created_at: string | null;
};

type StoreOrderItem = {
  id: number;
  product_id: number | null;
  product_name: string;
  product_slug: string | null;
  size: string | null;
  color: string | null;
  oz: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
};

type StoreOrderDetail = {
  id: number;
  code: string;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string | null;
  items: StoreOrderItem[];
};

function money(n: any) {
  const v = Number(n ?? 0);
  return `S/ ${v.toFixed(2)}`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function statusLabel(s: OrderStatus) {
  if (s === "pending") return "Pendiente";
  if (s === "confirmed") return "Confirmado";
  if (s === "preparing") return "Preparando";
  if (s === "ready") return "Listo";
  if (s === "delivered") return "Entregado";
  return "Cancelado";
}

function payLabel(p: PaymentMethod) {
  if (p === "cash") return "Efectivo";
  if (p === "whatsapp") return "WhatsApp";
  if (p === "yape") return "Yape";
  return "Pasarela";
}

function variantLabel(it: StoreOrderItem) {
  const parts = [it.size, it.color, it.oz].filter(Boolean);
  return parts.length ? `(${parts.join(" / ")})` : "";
}

export default function StoreOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [payment, setPayment] = useState<"" | PaymentMethod>("");

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [items, setItems] = useState<StoreOrderLite[]>([]);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number } | null>(null);

  // Modal detalle
  const [open, setOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<StoreOrderDetail | null>(null);

  const [saving, setSaving] = useState(false);
  const [patch, setPatch] = useState<{ status?: OrderStatus; payment_method?: PaymentMethod; notes?: string }>({});

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/api/store/orders", {
        params: {
          q: q.trim() || undefined,
          status: status || undefined,
          payment_method: payment || undefined,
          page,
          per_page: perPage,
        },
      });

      const list = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];
      const pag = res.data?.data?.pagination;

      setItems(list);
      setPagination(
        pag
          ? { current_page: Number(pag.current_page ?? 1), last_page: Number(pag.last_page ?? 1), total: Number(pag.total ?? 0) }
          : null
      );
    } catch (e: any) {
      setItems([]);
      setPagination(null);
      setError("No se pudieron cargar los pedidos (revisa sesión / API).");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: number) => {
    setOpen(true);
    setDetail(null);
    setPatch({});
    setDetailLoading(true);
    setError(null);

    try {
      const res = await api.get(`/api/store/orders/${id}`);
      const d = res.data?.data ?? null;
      setDetail(d);
      setPatch({
        status: d?.status,
        payment_method: d?.payment_method,
        notes: d?.notes ?? "",
      });
    } catch {
      setDetail(null);
      setError("No se pudo abrir el pedido.");
      setOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!detail) return;
    setSaving(true);
    setError(null);

    try {
      await api.put(`/api/store/orders/${detail.id}`, {
        status: patch.status,
        payment_method: patch.payment_method,
        notes: patch.notes ?? "",
      });

      // refresca detalle + lista
      await openDetail(detail.id);
      await loadOrders();
    } catch {
      setError("No se pudo actualizar el pedido.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Cuando cambias filtros, vuelve a página 1 y recarga
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, payment]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, payment, perPage]);

  const totalShown = useMemo(() => items.length, [items]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0 }}>Pedidos (Tienda)</h2>
          <p style={{ marginTop: 6, opacity: 0.8 }}>
            Pedidos creados desde la web pública (checkout WhatsApp/Efectivo). Total:{" "}
            <b>{pagination?.total ?? "—"}</b>
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={loadOrders} disabled={loading}>
            Recargar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 10, border: "1px solid #ff6a0033" }}>
          {error}
        </div>
      )}

      {/* Filtros */}
      <div style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "2fr 1fr 1fr" }}>
        <input
          placeholder="Buscar por código, teléfono o nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          style={{ padding: 10, borderRadius: 10 }}
        >
          <option value="">Estado: Todos</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Listo</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value as any)}
          style={{ padding: 10, borderRadius: 10 }}
        >
          <option value="">Pago: Todos</option>
          <option value="cash">Efectivo</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="yape">Yape</option>
          <option value="gateway">Pasarela</option>
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
                <th style={{ padding: 10 }}>Pedido</th>
                <th style={{ padding: 10 }}>Cliente</th>
                <th style={{ padding: 10 }}>Pago</th>
                <th style={{ padding: 10 }}>Estado</th>
                <th style={{ padding: 10 }}>Total</th>
                <th style={{ padding: 10, width: 160 }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 900 }}>{o.code}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {fmtDate(o.created_at)} · Items: {o.items_count}
                    </div>
                  </td>

                  <td style={{ padding: 10 }}>
                    <div style={{ fontWeight: 800 }}>{o.customer_name || "—"}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{o.customer_phone}</div>
                  </td>

                  <td style={{ padding: 10 }}>{payLabel(o.payment_method)}</td>

                  <td style={{ padding: 10 }}>
                    <span style={{ fontWeight: 900 }}>{statusLabel(o.status)}</span>
                  </td>

                  <td style={{ padding: 10 }}>
                    <b>{money(o.total)}</b>
                  </td>

                  <td style={{ padding: 10 }}>
                    <button className="btn btn-primary" onClick={() => openDetail(o.id)}>
                      Ver
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.8 }}>
                    No hay pedidos con esos filtros. (Mostrando {totalShown})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {pagination && pagination.last_page > 1 && (
        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end" }}>
          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ← Anterior
          </button>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}>
            Página {pagination.current_page} / {pagination.last_page}
          </div>
          <button
            className="btn"
            disabled={page >= pagination.last_page}
            onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal detalle */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            style={{ width: "min(920px, 96vw)", maxHeight: "92vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Detalle del pedido</h3>
              <div style={{ marginLeft: "auto" }}>
                <button className="btn" onClick={() => setOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>

            {detailLoading || !detail ? (
              <div style={{ padding: 12, marginTop: 10 }}>Cargando detalle...</div>
            ) : (
              <>
                {/* Cabecera */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                  <div style={{ border: "1px solid rgba(0,0,0,.10)", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>{detail.code}</div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtDate(detail.created_at)}</div>

                    <div style={{ marginTop: 10, display: "grid", gap: 6, fontSize: 13 }}>
                      <div><b>Cliente:</b> {detail.customer_name || "—"}</div>
                      <div><b>Teléfono:</b> {detail.customer_phone}</div>
                      <div><b>Email:</b> {detail.customer_email || "—"}</div>
                    </div>

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a
                        className="btn"
                        href={`https://wa.me/${detail.customer_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp del cliente"
                      >
                        WhatsApp cliente
                      </a>
                    </div>
                  </div>

                  <div style={{ border: "1px solid rgba(0,0,0,.10)", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 900, marginBottom: 8 }}>Gestión</div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                        Estado
                        <select
                          value={patch.status ?? detail.status}
                          onChange={(e) => setPatch((p) => ({ ...p, status: e.target.value as OrderStatus }))}
                          style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 10 }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="preparing">Preparando</option>
                          <option value="ready">Listo</option>
                          <option value="delivered">Entregado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </label>

                      <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                        Método de pago
                        <select
                          value={patch.payment_method ?? detail.payment_method}
                          onChange={(e) => setPatch((p) => ({ ...p, payment_method: e.target.value as PaymentMethod }))}
                          style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 10 }}
                        >
                          <option value="cash">Efectivo</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="yape">Yape</option>
                          <option value="gateway">Pasarela</option>
                        </select>
                      </label>

                      <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>
                        Notas
                        <textarea
                          value={patch.notes ?? detail.notes ?? ""}
                          onChange={(e) => setPatch((p) => ({ ...p, notes: e.target.value }))}
                          rows={4}
                          style={{ marginTop: 6, width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,.15)" }}
                        />
                      </label>

                      <button className="btn btn-primary" onClick={saveDetail} disabled={saving}>
                        {saving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Productos</div>

                  <div style={{ border: "1px solid rgba(0,0,0,.10)", borderRadius: 12, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(0,0,0,.10)" }}>
                          <th style={{ padding: 10 }}>Producto</th>
                          <th style={{ padding: 10 }}>Variante</th>
                          <th style={{ padding: 10 }}>Precio</th>
                          <th style={{ padding: 10 }}>Cant.</th>
                          <th style={{ padding: 10 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((it) => (
                          <tr key={it.id} style={{ borderBottom: "1px solid rgba(0,0,0,.08)" }}>
                            <td style={{ padding: 10, fontWeight: 800 }}>{it.product_name}</td>
                            <td style={{ padding: 10, opacity: 0.85 }}>{variantLabel(it)}</td>
                            <td style={{ padding: 10 }}>{money(it.unit_price)}</td>
                            <td style={{ padding: 10 }}>{it.qty}</td>
                            <td style={{ padding: 10, fontWeight: 900 }}>{money(it.line_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.75, alignSelf: "center" }}>
                      Subtotal: <b>{money(detail.subtotal)}</b>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>
                      Total: {money(detail.total)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
