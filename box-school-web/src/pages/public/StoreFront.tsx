import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import type { StoreCategory, StoreProduct } from "./store/types";
import {
  addToCart,
  cartCount,
  cartTotal,
  loadCart,
  removeFromCart,
  setQty,
  type CartItem,
} from "./store/cart";

type PaymentMethod = "cash" | "whatsapp" | "yape" | "gateway";

// ✅ money a prueba de undefined/null/string
function money(n: any) {
  const v = Number(n);
  return `S/ ${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
}

function getVariantLabel(it: CartItem) {
  const parts = [it.size, it.color].filter(Boolean);
  return parts.length ? `(${parts.join(" / ")})` : "";
}

/** ✅ Extrae un array desde respuestas con formatos distintos */
function pickArrayFromResponse(res: any): any[] {
  const raw = res?.data?.data;

  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.items?.data)) return raw.items.data;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;

  return [];
}

export default function StoreFront() {
  // ✅ CAMBIA TU NÚMERO (Perú: 51 + 9xxxxxxxx)
  const WHATSAPP_NUMBER = "51999999999";

  const [q, setQ] = useState("");
  const [catSlug, setCatSlug] = useState<string | "Todos">("Todos");
  const [sort, setSort] = useState<"featured" | "price_asc" | "price_desc">("featured");

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // ✅ Datos del cliente (para registrar pedido)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const paymentEnabled: Record<PaymentMethod, boolean> = {
    cash: true,
    whatsapp: true,
    yape: false,
    gateway: false,
  };

  useEffect(() => {
    setCart(loadCart());
  }, []);

  // ✅ Categorías
  useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingCats(true);
      try {
        const res = await api.get("/api/product-categories");
        const items = pickArrayFromResponse(res);
        if (alive) setCategories(items as StoreCategory[]);
      } catch {
        if (alive) setCategories([]);
      } finally {
        if (alive) setLoadingCats(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ Productos (debounce)
  useEffect(() => {
    const t = window.setTimeout(() => {
      let alive = true;
      const controller = new AbortController();

      (async () => {
        setLoadingProducts(true);
        setFetchError(null);

        try {
          const sortParam =
            sort === "price_asc"
              ? "price_asc"
              : sort === "price_desc"
              ? "price_desc"
              : "newest";

          const res = await api.get("/api/products", {
            params: {
              q: q.trim() || undefined,
              category: catSlug === "Todos" ? undefined : catSlug,
              sort: sortParam,
              per_page: 60,
            },
            signal: controller.signal,
          });

          const items = pickArrayFromResponse(res);
          if (alive) setProducts(items as StoreProduct[]);
        } catch {
          if (alive) {
            setProducts([]);
            setFetchError("No se pudieron cargar los productos.");
          }
        } finally {
          if (alive) setLoadingProducts(false);
        }
      })();

      return () => {
        alive = false;
        controller.abort();
      };
    }, 260);

    return () => window.clearTimeout(t);
  }, [q, catSlug, sort]);

  const count = useMemo(() => cartCount(cart), [cart]);
  const total = useMemo(() => cartTotal(cart), [cart]);

  const add = (p: StoreProduct) => {
    setCart((prev) =>
      addToCart(prev, {
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        // ✅ fuerza número seguro
        price: Number((p as any).price ?? 0),
        image: (p as any).image ?? null,
        qty: 1,
      })
    );
    setCartOpen(true);
  };

  const paymentLabel = (m: PaymentMethod) => {
    if (m === "cash") return "Efectivo";
    if (m === "whatsapp") return "WhatsApp";
    if (m === "yape") return "Yape (pronto)";
    return "Pasarela (pronto)";
  };

  // ✅ Crea pedido en backend y luego abre WhatsApp con código
  const checkoutWhatsApp = async () => {
    setCheckoutError(null);

    const phone = customerPhone.trim();
    const name = customerName.trim();

    if (!phone) {
      setCheckoutError("Ingresa tu celular para registrar el pedido.");
      return;
    }

    setCheckoutLoading(true);

    let orderCode: string | null = null;

    try {
      const payload = {
        customer_name: name || null,
        customer_phone: phone,
        customer_email: null,
        payment_method: payMethod,
        notes: null,
        items: cart.map((it) => ({
          product_id: it.product_id,
          qty: it.qty,
          size: it.size ?? null,
          color: it.color ?? null,
          oz: (it as any).oz ?? null,
        })),
      };

      const res = await api.post("/api/store/orders", payload);
      orderCode = res.data?.data?.code ?? null;
    } catch {
      // si falla, igual abrimos WhatsApp, pero avisamos
      setCheckoutError("No se pudo registrar el pedido en el sistema, pero puedes continuar por WhatsApp.");
    } finally {
      setCheckoutLoading(false);
    }

    const lines = cart.map((it) => {
      const variant = getVariantLabel(it);
      const sub = Number(it.price ?? 0) * it.qty;
      return `• ${it.name} ${variant} x${it.qty} — ${money(sub)}`;
    });

    const msg =
      `Hola, quiero comprar en la tienda del Club de Box El Tigre.\n` +
      (orderCode ? `Pedido: ${orderCode}\n\n` : `\n`) +
      `Pedido:\n${lines.join("\n")}\n\n` +
      `Total aprox: ${money(total)}\n` +
      `Método de pago: ${paymentLabel(payMethod)}\n` +
      `Celular: ${phone}\n` +
      (name ? `Nombre: ${name}\n\n` : `\n`) +
      `¿Cómo coordinamos entrega o recojo?`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const choosePay = (m: PaymentMethod) => {
    if (!paymentEnabled[m]) return;
    setPayMethod(m);
  };

  return (
    <section className="pub-container">
      <div className="pub-section">
        <div className="pub-section__head">
          <h1 className="pub-section__title">Tienda</h1>
          <p className="pub-section__text">Equipamiento y accesorios del Club de Box El Tigre.</p>
        </div>

        <div className="pub-store-toolbar">
          <input
            className="pub-input pub-store-search"
            placeholder="Buscar guantes, vendas, protección..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="pub-store-filters">
            <select
              className="pub-input"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              disabled={loadingCats}
            >
              <option value="Todos">
                {loadingCats ? "Cargando categorías..." : "Todas las categorías"}
              </option>

              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <select className="pub-input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="featured">Destacados</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
            </select>

            <button className="pub-btn pub-btn--accent" type="button" onClick={() => setCartOpen(true)}>
              Carrito ({count})
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="pub-card" style={{ marginTop: 14 }}>
            {fetchError}
          </div>
        )}

        <div className="pub-store-grid">
          {loadingProducts ? (
            <div className="pub-card" style={{ gridColumn: "1 / -1" }}>
              Cargando productos...
            </div>
          ) : (
            products.map((p: any) => (
              <div key={p.id} className="pub-card pub-product">
                <div className="pub-product__img" style={{ backgroundImage: `url(${p.image ?? ""})` }} />

                <div className="pub-product__body">
                  <div className="pub-product__top">
                    <div className="pub-tag">{p.category?.name ?? "Tienda"}</div>
                  </div>

                  <div className="pub-product__name">{p.name}</div>

                  <div className="pub-product__meta">
                    <span className="pub-muted">{p.brand ?? "El Tigre"}</span>
                    <span className="pub-muted">Stock: {Number(p.total_stock ?? 0)}</span>
                  </div>

                  <div className="pub-product__price">
                    <span className="pub-price">{money(p.price ?? 0)}</span>
                    {p.compare_at_price ? (
                      <span className="pub-price--old">{money(p.compare_at_price)}</span>
                    ) : null}
                  </div>

                  <div className="pub-product__actions">
                    <button
                      className="pub-btn pub-btn--accent"
                      type="button"
                      onClick={() => add(p)}
                      disabled={Number(p.total_stock ?? 0) <= 0}
                      title={Number(p.total_stock ?? 0) <= 0 ? "Sin stock" : ""}
                    >
                      {Number(p.total_stock ?? 0) <= 0 ? "Sin stock" : "Agregar"}
                    </button>

                    <button className="pub-btn pub-btn--outline" type="button" onClick={() => setCartOpen(true)}>
                      Ver carrito
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loadingProducts && products.length === 0 && (
          <div className="pub-card" style={{ marginTop: 14 }}>
            No hay resultados para tu búsqueda.
          </div>
        )}
      </div>

      {/* Drawer carrito */}
      {cartOpen && (
        <div className="pub-drawer" role="dialog" aria-modal="true" aria-label="Carrito">
          <button className="pub-drawer__backdrop" onClick={() => setCartOpen(false)} aria-label="Cerrar" />
          <div className="pub-drawer__panel">
            <div className="pub-drawer__top">
              <div className="pub-drawer__title">Carrito</div>
              <button className="pub-btn pub-btn--outline pub-btn--sm" onClick={() => setCartOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="pub-card" style={{ marginTop: 12 }}>
                Tu carrito está vacío.
              </div>
            ) : (
              <>
                <div className="pub-cart-list">
                  {cart.map((it, idx) => (
                    <div key={`${it.product_id}-${idx}`} className="pub-cart-item">
                      <div className="pub-cart-item__img" style={{ backgroundImage: `url(${it.image ?? ""})` }} />
                      <div className="pub-cart-item__info">
                        <div className="pub-cart-item__name">
                          {it.name} <span className="pub-cart-item__variant">{getVariantLabel(it)}</span>
                        </div>
                        <div className="pub-muted">{money(it.price ?? 0)}</div>

                        <div className="pub-cart-item__controls">
                          <button
                            className="pub-btn pub-btn--outline pub-btn--sm"
                            type="button"
                            onClick={() => setCart((prev) => setQty(prev, idx, it.qty - 1))}
                          >
                            -
                          </button>

                          <div className="pub-cart-item__qty">{it.qty}</div>

                          <button
                            className="pub-btn pub-btn--outline pub-btn--sm"
                            type="button"
                            onClick={() => setCart((prev) => setQty(prev, idx, it.qty + 1))}
                          >
                            +
                          </button>

                          <button
                            className="pub-btn pub-btn--outline pub-btn--sm"
                            type="button"
                            onClick={() => setCart((prev) => removeFromCart(prev, idx))}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ✅ Datos cliente */}
                <div className="pub-card" style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>Datos para el pedido</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <input
                      className="pub-input"
                      placeholder="Nombre (opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                      className="pub-input"
                      placeholder="Celular (obligatorio)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                    {checkoutError && (
                      <div className="pub-card" style={{ border: "1px solid rgba(255,106,0,.35)" }}>
                        {checkoutError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Métodos de pago */}
                <div className="pub-pay">
                  <div className="pub-pay__title">Método de pago</div>

                  <div className="pub-pay__grid">
                    <button
                      type="button"
                      className={`pub-pay__card ${payMethod === "cash" ? "is-active" : ""}`}
                      onClick={() => choosePay("cash")}
                    >
                      <div className="pub-pay__name">💵 Efectivo</div>
                      <div className="pub-pay__desc">Pago al recojo o entrega.</div>
                    </button>

                    <button
                      type="button"
                      className={`pub-pay__card ${payMethod === "whatsapp" ? "is-active" : ""}`}
                      onClick={() => choosePay("whatsapp")}
                    >
                      <div className="pub-pay__name">💬 WhatsApp</div>
                      <div className="pub-pay__desc">Coordinación rápida.</div>
                    </button>

                    <button type="button" className="pub-pay__card is-disabled" disabled title="Pronto se activará">
                      <div className="pub-pay__name">📲 Yape</div>
                      <div className="pub-pay__desc">Pronto se activará</div>
                    </button>

                    <button type="button" className="pub-pay__card is-disabled" disabled title="Pronto se activará">
                      <div className="pub-pay__name">💳 Pasarela</div>
                      <div className="pub-pay__desc">Pronto se activará</div>
                    </button>
                  </div>
                </div>

                <div className="pub-drawer__bottom">
                  <div className="pub-total">
                    <span>Total aprox.</span>
                    <b>{money(total)}</b>
                  </div>

                  <button
                    className="pub-btn pub-btn--accent"
                    type="button"
                    onClick={checkoutWhatsApp}
                    disabled={checkoutLoading}
                    aria-busy={checkoutLoading}
                    title={checkoutLoading ? "Creando pedido..." : ""}
                  >
                    {checkoutLoading ? "Registrando pedido..." : "Finalizar por WhatsApp"}
                  </button>

                  <div className="pub-muted" style={{ fontSize: 12 }}>
                    * Primero registramos el pedido y luego abrimos WhatsApp.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
