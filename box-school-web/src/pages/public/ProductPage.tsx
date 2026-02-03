import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { addToCart, loadCart } from "./store/cart";
import type { StoreProduct, StoreProductVariant } from "./store/types";

function money(n: any) {
  const v = Number(n);
  return `S/ ${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
}

function cartCountLocal(items: any[]) {
  return items.reduce((acc, it) => acc + Number(it?.qty ?? 0), 0);
}

function variantLabel(v: StoreProductVariant) {
  const parts = [v.size, v.color, v.oz ? `${v.oz}` : null].filter(Boolean);
  return parts.length ? parts.join(" / ") : `Variante #${v.id}`;
}

export default function PublicProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [p, setP] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [count, setCount] = useState<number>(() => cartCountLocal(loadCart()));

  const [variantId, setVariantId] = useState<number | "">("");

  useEffect(() => {
    if (!slug) return;

    let alive = true;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const res = await api.get(`/api/products/${slug}`, { signal: controller.signal });
        const product = (res as any)?.data?.data ?? (res as any)?.data ?? null;

        if (alive) {
          const prod = product as StoreProduct;
          setP(prod);

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

  const variants = useMemo(() => {
    const vars = Array.isArray((p as any)?.variants) ? ((p as any).variants as StoreProductVariant[]) : [];
    return vars.filter((v) => v?.is_active);
  }, [p]);

  const hasVariants = useMemo(() => Boolean((p as any)?.has_variants) || variants.length > 0, [p, variants]);

  const selectedVariant = useMemo(() => {
    if (!variantId) return null;
    return variants.find((v) => Number(v.id) === Number(variantId)) ?? null;
  }, [variantId, variants]);

  const stock = useMemo(() => {
    if (!p) return 0;
    if (hasVariants) return Number(selectedVariant?.stock ?? 0);
    return Number((p as any)?.total_stock ?? 0);
  }, [p, hasVariants, selectedVariant]);

  const outOfStock = stock <= 0;

  const price = useMemo(() => {
    if (!p) return 0;
    const ov = selectedVariant?.price_override;
    if (hasVariants && ov != null) return Number(ov);
    return Number((p as any).price ?? 0);
  }, [p, hasVariants, selectedVariant]);

  const hasDiscount = useMemo(() => Boolean((p as any)?.compare_at_price), [p]);

  const canAdd = useMemo(() => {
    if (!p) return false;
    if (outOfStock) return false;
    if (hasVariants && !selectedVariant) return false;
    return true;
  }, [p, outOfStock, hasVariants, selectedVariant]);

  const handleAdd = () => {
    if (!p) return;

    if (hasVariants && !selectedVariant) {
      setNotice("Selecciona una variante antes de agregar.");
      window.setTimeout(() => setNotice(null), 2200);
      return;
    }

    const current = loadCart();

    const next = addToCart(current, {
      product_id: (p as any).id,
      variant_id: selectedVariant?.id ?? null, // ✅ CLAVE

      slug: (p as any).slug,
      name: (p as any).name,
      price: price,
      image: (p as any).image ?? null,
      qty: 1,

      // solo para mostrar bonito
      size: selectedVariant?.size ?? undefined,
      color: selectedVariant?.color ?? undefined,
      oz: selectedVariant?.oz != null ? String(selectedVariant.oz) : undefined,
    });

    setCount(cartCountLocal(next));
    setNotice("Agregado al carrito ✅");
    window.setTimeout(() => setNotice(null), 2200);
  };

  return (
    <section className="pub-container">
      <div className="pub-section">
        <div className="pub-detailHead">
          <button className="pub-btn pub-btn--outline" type="button" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          <div className="pub-detailHead__right">
            <Link className="pub-btn pub-btn--outline" to="/tienda">
              Ir a tienda
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="pub-card" style={{ marginTop: 14 }}>
            Cargando producto...
          </div>
        ) : err ? (
          <div className="pub-card" style={{ marginTop: 14 }}>
            {err}
          </div>
        ) : !p ? (
          <div className="pub-card" style={{ marginTop: 14 }}>
            Producto no encontrado.
          </div>
        ) : (
          <>
            {notice ? (
              <div className="pub-card pub-detailNotice" style={{ marginTop: 14 }}>
                {notice}
              </div>
            ) : null}

            <div className="pub-card pub-detail" style={{ marginTop: 14 }}>
              <div
                className="pub-detail__img"
                style={{ backgroundImage: `url(${(p as any).image ?? ""})` }}
                role="img"
                aria-label={(p as any).name}
              >
                {hasDiscount ? <div className="pub-badge-offer">OFERTA</div> : null}
                {outOfStock ? <div className="pub-badge-stockout">SIN STOCK</div> : null}
              </div>

              <div className="pub-detail__info">
                <div className="pub-tag">{(p as any).category?.name ?? "Tienda"}</div>

                <h1 className="pub-detail__name">{(p as any).name}</h1>

                <div className="pub-detail__meta">
                  <span className="pub-muted">{(p as any).brand ?? "El Tigre"}</span>
                  <span className="pub-muted">
                    Stock: <b>{stock}</b>
                  </span>
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
                  <div className="pub-detail__variants">
                    <select
                      className="pub-input"
                      value={variantId}
                      onChange={(e) => setVariantId(e.target.value ? Number(e.target.value) : "")}
                    >
                      <option value="">Seleccionar variante...</option>
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
                    onClick={handleAdd}
                    disabled={!canAdd}
                    title={!canAdd ? "Selecciona variante / sin stock" : ""}
                  >
                    {!canAdd ? "No disponible" : "Agregar al carrito"}
                  </button>

                  <Link className="pub-btn pub-btn--outline" to="/tienda">
                    Seguir comprando
                  </Link>

                  <Link className="pub-btn pub-btn--outline" to="/tienda?cart=1">
                    Ver carrito ({count})
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
