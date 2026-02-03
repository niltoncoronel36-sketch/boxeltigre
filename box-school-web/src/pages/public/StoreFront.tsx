import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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
  const parts = [it.size, it.color, (it as any).oz].filter(Boolean);
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

/* =======================
   ✅ Banner rotativo PRO (con imágenes)
======================= */
type BannerItem = {
  title: string;
  text?: string;
  cta?: string;
  href?: string;
  image: string; // desktop (public/banners/...)
  imageMobile?: string; // opcional móvil
  tone?: "accent" | "dark";
};

function BannerRotator() {
  const items: BannerItem[] = useMemo(
    () => [
      {
        title: "🔥 OFERTAS HOY",
        text: "10% en guantes seleccionados • Usa: TIGRE10",
        cta: "Ver ofertas",
        href: "/tienda",
        image: "/banners/oferta.png",
        imageMobile: "/banners/oferta-1-m.webp",
        tone: "accent",
      },
      {
        title: "🚚 Envíos en Lima",
        text: "Coordina por WhatsApp • Entrega rápida",
        cta: "Cómo funciona",
        href: "/contacto",
        image: "/banners/oferta2.png",
        imageMobile: "/banners/oferta-2-m.webp",
        tone: "dark",
      },
      {
        title: "🎁 Packs",
        text: "Vendas + protector bucal • Promo limitada",
        cta: "Ver packs",
        href: "/tienda",
        image: "/banners/oferta3.png",
        imageMobile: "/banners/oferta-3-m.webp",
        tone: "accent",
      },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => setIdx((p) => (p + 1) % items.length), 5200);
    return () => window.clearInterval(id);
  }, [items.length]);

  const b = items[idx];
  const Wrap: any = b.href ? Link : "div";
  const wrapProps = b.href ? { to: b.href } : {};

  return (
    <div className="pub-bannerWrap" aria-label="Ofertas">
      <Wrap
        className={`pub-bannerPro ${b.tone === "dark" ? "is-dark" : "is-accent"}`}
        {...wrapProps}
        style={{ ["--bg" as any]: `url(${b.image})` }}
      >
        {b.imageMobile ? (
          <span className="pub-bannerPro__mobile" style={{ ["--bgm" as any]: `url(${b.imageMobile})` }} />
        ) : null}

        <div className="pub-bannerPro__shade" />

        <div className="pub-bannerPro__content">
          <div className="pub-bannerPro__title">{b.title}</div>
          {b.text ? <div className="pub-bannerPro__text">{b.text}</div> : null}
          {b.cta ? <div className="pub-bannerPro__cta">{b.cta} →</div> : null}
        </div>

        <div className="pub-bannerPro__dots" aria-label="Cambiar banner">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pub-bannerPro__dot ${i === idx ? "is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setIdx(i);
              }}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>
      </Wrap>
    </div>
  );
}

export default function StoreFront() {
  // ✅ WhatsApp sin espacios
  const WHATSAPP_NUMBER = "51947637782";

  const location = useLocation();
  const navigate = useNavigate();

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

  // ✅ Datos del cliente
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

  // ✅ Si vienes de detalle con ?cart=1 -> abrir drawer y limpiar URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);

    if (sp.get("cart") === "1") {
      setCartOpen(true);

      sp.delete("cart");
      const next = sp.toString();
      navigate(next ? `/tienda?${next}` : "/tienda", { replace: true });
    }
  }, [location.search, navigate]);

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
    let alive = true;
    const controller = new AbortController();

    const t = window.setTimeout(() => {
      (async () => {
        setLoadingProducts(true);
        setFetchError(null);

        try {
          const sortParam =
            sort === "price_asc" ? "price_asc" : sort === "price_desc" ? "price_desc" : "newest";

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
    }, 260);

    return () => {
      alive = false;
      window.clearTimeout(t);
      controller.abort();
    };
  }, [q, catSlug, sort]);

  const count = useMemo(() => cartCount(cart), [cart]);
  const total = useMemo(() => cartTotal(cart), [cart]);

  // ✅ SOLO bloquea si requiere variante y no tiene variant_id
  const missingVariant = useMemo(() => {
    return cart.some((it: any) => Boolean(it.requires_variant) && it.variant_id == null);
  }, [cart]);

  const paymentLabel = (m: PaymentMethod) => {
    if (m === "cash") return "Efectivo";
    if (m === "whatsapp") return "WhatsApp";
    if (m === "yape") return "Yape (pronto)";
    return "Pasarela (pronto)";
  };

  const choosePay = (m: PaymentMethod) => {
    if (!paymentEnabled[m]) return;
    setPayMethod(m);
  };

  // ✅ Agregar desde grilla:
  // Si el producto tiene variantes, NO se puede agregar directo → mandamos al detalle.
  const add = (p: StoreProduct) => {
    const hasVariants = Boolean((p as any).has_variants);

    if (hasVariants) {
      navigate(`/tienda/${p.slug}`);
      return;
    }

    setCart((prev) =>
      addToCart(prev as any, {
        product_id: p.id,
        slug: p.slug,
        name: p.name,
        price: Number((p as any).price ?? 0),
        image: (p as any).image ?? null,
        qty: 1,

        // ✅ este producto NO requiere variante
        requires_variant: false,
        variant_id: null,
      } as any)
    );
    setCartOpen(true);
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

    if (missingVariant) {
      setCheckoutError("Hay productos en el carrito sin variante seleccionada. Entra al detalle y elige la variante.");
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
        items: cart.map((it: any) => ({
          product_id: it.product_id,
          variant_id: it.variant_id ?? null,
          qty: it.qty,
          size: it.size ?? null,
          color: it.color ?? null,
          oz: it.oz ?? null,
        })),
      };

      const res = await api.post("/api/store/orders", payload);
      orderCode = res.data?.data?.code ?? null;
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setCheckoutError(msg || "No se pudo registrar el pedido en el sistema, pero puedes continuar por WhatsApp.");
    } finally {
      setCheckoutLoading(false);
    }

    const lines = cart.map((it: any) => {
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

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="pub-container">
      <div className="pub-section">
        <BannerRotator />

        <div className="pub-section__head">
          <h1 className="pub-section__title">Tienda</h1>
          <p className="pub-section__text">Equipamiento y accesorios del Club de Box El Tigre.</p>
        </div>

        <div className="pub-store-toolbar pub-store-toolbar--oneRow">
          <input
            className="pub-input pub-store-search"
            placeholder="Buscar guantes, vendas, protección..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="pub-input pub-store-select"
            value={catSlug}
            onChange={(e) => setCatSlug(e.target.value)}
            disabled={loadingCats}
            title="Categoría"
          >
            <option value="Todos">{loadingCats ? "Cargando..." : "Todas"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="pub-input pub-store-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            title="Orden"
          >
            <option value="featured">Destacados</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
          </select>

          <button className="pub-btn pub-btn--accent pub-store-cartBtn" type="button" onClick={() => setCartOpen(true)}>
            Carrito ({count})
          </button>
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
            products.map((p: any) => {
              const stock = Number(p.total_stock ?? 0);
              const hasDiscount = Boolean(p.compare_at_price);
              const hasVariants = Boolean(p.has_variants);

              return (
                <div key={p.id} className="pub-card pub-product">
                  <Link
                    to={`/tienda/${p.slug}`}
                    className="pub-product__img"
                    style={{ backgroundImage: `url(${p.image ?? ""})` }}
                    aria-label={`Ver detalle de ${p.name}`}
                  >
                    {hasDiscount ? <div className="pub-badge-offer">OFERTA</div> : null}
                    {stock <= 0 ? <div className="pub-badge-stockout">SIN STOCK</div> : null}
                  </Link>

                  <div className="pub-product__body">
                    <div className="pub-product__top">
                      <div className="pub-tag">{p.category?.name ?? "Tienda"}</div>
                    </div>

                    <Link to={`/tienda/${p.slug}`} className="pub-product__nameLink">
                      <div className="pub-product__name">{p.name}</div>
                    </Link>

                    <div className="pub-product__meta">
                      <span className="pub-muted">{p.brand ?? "El Tigre"}</span>
                      <span className="pub-muted">Stock: {stock}</span>
                    </div>

                    <div className="pub-product__price">
                      <span className="pub-price">{money(p.price ?? 0)}</span>
                      {p.compare_at_price ? <span className="pub-price--old">{money(p.compare_at_price)}</span> : null}
                    </div>

                    <div className="pub-product__actions pub-product__actions--3">
                      <button
                        className="pub-btn pub-btn--accent"
                        type="button"
                        onClick={() => add(p)}
                        disabled={stock <= 0}
                        title={stock <= 0 ? "Sin stock" : hasVariants ? "Selecciona variante en detalle" : ""}
                      >
                        {stock <= 0 ? "Sin stock" : hasVariants ? "Elegir variante" : "Agregar"}
                      </button>

                      <Link className="pub-btn pub-btn--outline" to={`/tienda/${p.slug}`}>
                        Detalle
                      </Link>

                      <button className="pub-btn pub-btn--outline" type="button" onClick={() => setCartOpen(true)}>
                        Ver carrito
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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
                  {cart.map((it: any, idx) => (
                    <div key={`${it.product_id}-${it.variant_id ?? "novar"}-${idx}`} className="pub-cart-item">
                      <div className="pub-cart-item__img" style={{ backgroundImage: `url(${it.image ?? ""})` }} />

                      <div className="pub-cart-item__info">
                        <div className="pub-cart-item__name">
                          {it.name} <span className="pub-cart-item__variant">{getVariantLabel(it)}</span>
                        </div>

                        {/* ✅ Aviso SOLO si requiere variante */}
                        {it.requires_variant && it.variant_id == null ? (
                          <div className="pub-muted" style={{ fontSize: 12 }}>
                            ⚠️ Falta variante. Entra al detalle para elegirla.
                          </div>
                        ) : null}

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

                        {/* ✅ Botón para ir a elegir variante si falta */}
                        {it.requires_variant && it.variant_id == null ? (
                          <div style={{ marginTop: 8 }}>
                            <Link className="pub-btn pub-btn--outline pub-btn--sm" to={`/tienda/${it.slug}`}>
                              Elegir variante
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

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
                    title={checkoutLoading ? "Creando pedido..." : missingVariant ? "Faltan variantes" : ""}
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
