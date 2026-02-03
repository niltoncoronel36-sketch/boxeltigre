import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../../services/api";
import type { StoreProduct, StoreProductVariant } from "./store/types";
import { addToCart, cartCount, loadCart, type CartItem } from "./store/cart";

function money(n: any) {
  const v = Number(n);
  return `S/ ${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
}

function variantLabel(v: StoreProductVariant) {
  const parts = [v.size, v.color, v.oz ? `${v.oz}` : null].filter(Boolean);
  return parts.length ? parts.join(" / ") : `Variante #${v.id}`;
}

export default function StoreProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();

  const [p, setP] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const [variantId, setVariantId] = useState<number | "">("");

  useEffect(() => setCart(loadCart()), []);

  useEffect(() => {
    if (!slug) return;

    let alive = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const res = await api.get(`/api/products/${slug}`, { signal: controller.signal });
        const data = res?.data?.data ?? res?.data ?? null;
        if (alive) {
          const prod = data as StoreProduct;
          setP(prod);

          // Si tiene variantes, preselecciona la primera activa con stock
          const vars = Array.isArray((prod as any)?.variants) ? ((prod as any).variants as StoreProductVariant[]) : [];
          const first = vars.find((v) => v?.is_active && Number(v.stock) > 0) ?? null;
          setVariantId(first?.id ?? "");
        }
      } catch {
        if (alive) setErr("No se pudo cargar el producto.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [slug]);

  const count = useMemo(() => cartCount(cart), [cart]);

  const variants = useMemo(() => {
    const vars = Array.isArray((p as any)?.variants) ? ((p as any).variants as StoreProductVariant[]) : [];
    return vars.filter((v) => v?.is_active);
  }, [p]);

  const selectedVariant = useMemo(() => {
    if (!variantId) return null;
    return variants.find((v) => Number(v.id) === Number(variantId)) ?? null;
  }, [variantId, variants]);

  const hasVariants = useMemo(() => Boolean((p as any)?.has_variants) || variants.length > 0, [p, variants]);

  const stock = useMemo(() => {
    if (!p) return 0;
    if (hasVariants) return Number(selectedVariant?.stock ?? 0);
    return Number((p as any)?.total_stock ?? 0);
  }, [p, hasVariants, selectedVariant]);

  const price = useMemo(() => {
    if (!p) return 0;
    // Si hay variante y tiene override, úsalo
    const ov = selectedVariant?.price_override;
    if (hasVariants && ov != null) return Number(ov);
    return Number((p as any)?.price ?? 0);
  }, [p, hasVariants, selectedVariant]);

  const hasDiscount = useMemo(() => Boolean((p as any)?.compare_at_price), [p]);

  const canAdd = useMemo(() => {
    if (!p) return false;
    if (stock <= 0) return false;
    if (hasVariants && !selectedVariant) return false; // debe elegir
    return true;
  }, [p, stock, hasVariants, selectedVariant]);

  const onAdd = () => {
    if (!p) return;

    if (hasVariants && !selectedVariant) {
      setNotice("Selecciona una variante antes de agregar.");
      window.setTimeout(() => setNotice(null), 2000);
      return;
    }

    setCart((prev) => {
      const next = addToCart(prev, {
        product_id: p.id,
        variant_id: selectedVariant?.id ?? null, // ✅ CLAVE

        slug: p.slug,
        name: p.name,
        price: price,
        image: (p as any).image ?? null,
        qty: 1,

        // solo para mostrar bonito (opcional)
        size: selectedVariant?.size ?? undefined,
        color: selectedVariant?.color ?? undefined,
        oz: selectedVariant?.oz != null ? String(selectedVariant.oz) : undefined,
      });

      setNotice("Agregado al carrito ✅");
      window.setTimeout(() => setNotice(null), 1800);

      return next;
    });
  };

  return (
    <section className="pub-container">
      <div className="pub-section">
        <div className="pub-section__head pub-detailHead">
          <div>
            <h1 className="pub-section__title">Detalle del producto</h1>
            <p className="pub-section__text">
              <Link to="/tienda" className="pub-link">
                ← Volver a tienda
              </Link>
            </p>
          </div>

          <button className="pub-btn pub-btn--outline" type="button" onClick={() => nav("/tienda")}>
            Seguir comprando
          </button>
        </div>

        {notice ? (
          <div
            className="pub-card"
            style={{
              marginTop: 12,
              border: "1px solid rgba(255,106,0,.28)",
              background: "rgba(255,106,0,.10)",
            }}
          >
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="pub-card" style={{ marginTop: 12 }}>
            Cargando producto...
          </div>
        ) : err ? (
          <div className="pub-card" style={{ marginTop: 12 }}>
            {err}
          </div>
        ) : !p ? (
          <div className="pub-card" style={{ marginTop: 12 }}>
            Producto no encontrado.
          </div>
        ) : (
          <div className="pub-card pub-detail" style={{ marginTop: 12 }}>
            <div
              className="pub-detail__img"
              style={{ backgroundImage: `url(${(p as any).image ?? ""})` }}
              aria-label={p.name}
              role="img"
            >
              {hasDiscount ? <div className="pub-badge-offer">OFERTA</div> : null}
              {stock <= 0 ? <div className="pub-badge-stockout">SIN STOCK</div> : null}
            </div>

            <div className="pub-detail__info">
              <div className="pub-tag">{(p as any).category?.name ?? "Tienda"}</div>

              <h2 className="pub-detail__name">{p.name}</h2>

              <div className="pub-detail__meta">
                <span className="pub-muted">{(p as any).brand ?? "El Tigre"}</span>
                <span className="pub-muted">Stock: {stock}</span>
              </div>

              <div className="pub-detail__price">
                <span className="pub-price">{money(price)}</span>
                {hasDiscount ? <span className="pub-price--old">{money((p as any).compare_at_price)}</span> : null}
              </div>

              {(p as any).description ? (
                <p className="pub-detail__desc">{String((p as any).description)}</p>
              ) : (
                <p className="pub-muted">Sin descripción por ahora.</p>
              )}

              {/* ✅ Selector de variantes */}
              {hasVariants ? (
                <div style={{ marginTop: 12 }}>
                  <div className="pub-muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Elige una variante
                  </div>

                  <select
                    className="pub-input"
                    value={variantId}
                    onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">Seleccionar...</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id} disabled={Number(v.stock) <= 0}>
                        {variantLabel(v)} {Number(v.stock) <= 0 ? "(sin stock)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="pub-detail__actions">
                <button
                  className="pub-btn pub-btn--accent"
                  type="button"
                  onClick={onAdd}
                  disabled={!canAdd}
                  title={!canAdd ? "Selecciona variante / sin stock" : ""}
                >
                  {!canAdd ? "No disponible" : "Agregar al carrito"}
                </button>

                <Link className="pub-btn pub-btn--outline" to="/tienda">
                  Volver
                </Link>

                <Link className="pub-btn pub-btn--accent" to="/tienda?cart=1">
                  Ver carrito ({count})
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
