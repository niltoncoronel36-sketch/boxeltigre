import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../services/api";
import { addToCart, loadCart } from "../public/store/cart"; // ajusta ruta si es distinto
import type { StoreProduct } from "../public/store/types";  // ajusta ruta si es distinto

function money(n: any) {
  const v = Number(n);
  return `S/ ${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
}

export default function PublicProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [p, setP] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // opcional: variantes simples
  const [size, setSize] = useState<string>("");
  const [color, setColor] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // ✅ Backend recomendado: GET /api/products/{slug}
        const res = await api.get(`/api/products/${slug}`);
        const product = res.data?.data ?? res.data;
        if (alive) setP(product);
      } catch {
        if (alive) setErr("No se pudo cargar el producto.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const outOfStock = useMemo(() => Number(p?.total_stock ?? 0) <= 0, [p]);

  const handleAdd = () => {
    const cart = loadCart();
    const next = addToCart(cart, {
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price ?? 0),
      image: p.image ?? null,
      qty: 1,
      size: size || null,
      color: color || null,
    });
    // addToCart ya devuelve el array; tu store/cart probablemente lo guarda en localStorage
    // si no lo guarda, avísame y lo ajustamos
    alert("Agregado al carrito ✅");
  };

  return (
    <section className="pub-container">
      <div className="pub-section">
        <button className="pub-btn pub-btn--outline" type="button" onClick={() => navigate(-1)}>
          ← Volver
        </button>

        {loading ? (
          <div className="pub-card" style={{ marginTop: 14 }}>Cargando producto...</div>
        ) : err ? (
          <div className="pub-card" style={{ marginTop: 14 }}>{err}</div>
        ) : (
          <div className="pub-card" style={{ marginTop: 14, display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 420px) 1fr", gap: 16 }}>
              <div
                className="pub-product__img"
                style={{
                  minHeight: 320,
                  borderRadius: 16,
                  backgroundImage: `url(${p.image ?? ""})`,
                }}
              />

              <div style={{ display: "grid", gap: 10 }}>
                <div className="pub-tag">{p.category?.name ?? "Tienda"}</div>
                <h1 style={{ margin: 0, fontWeight: 1000 }}>{p.name}</h1>

                <div className="pub-product__price">
                  <span className="pub-price">{money(p.price ?? 0)}</span>
                  {p.compare_at_price ? <span className="pub-price--old">{money(p.compare_at_price)}</span> : null}
                </div>

                <div className="pub-muted">
                  Stock: <b>{Number(p.total_stock ?? 0)}</b>
                </div>

                {/* Variantes (si tu backend las maneja) */}
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input
                      className="pub-input"
                      placeholder="Talla (opcional)"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    />
                    <input
                      className="pub-input"
                      placeholder="Color (opcional)"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>

                  <button
                    className="pub-btn pub-btn--accent"
                    type="button"
                    onClick={handleAdd}
                    disabled={outOfStock}
                  >
                    {outOfStock ? "Sin stock" : "Agregar al carrito"}
                  </button>
                </div>
              </div>
            </div>

            {p.description ? (
              <div>
                <div style={{ fontWeight: 1000, marginBottom: 6 }}>Descripción</div>
                <div className="pub-muted" style={{ lineHeight: 1.6 }}>{p.description}</div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
