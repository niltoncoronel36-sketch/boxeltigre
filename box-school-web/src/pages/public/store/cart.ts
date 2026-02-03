export type CartItem = {
  product_id: number;
  variant_id?: number | null; // ✅ nuevo: variante seleccionada

  slug: string;
  name: string;
  price: number;
  image?: string | null;

  qty: number;

  // opcional: solo para mostrar
  size?: string;
  color?: string;
  oz?: string;
};

const KEY = "public_cart_v1";

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

// ✅ clave única de item: product_id + variant_id (si existe) + size/color/oz (fallback)
function sameItem(a: CartItem, b: CartItem) {
  const av = a.variant_id ?? null;
  const bv = b.variant_id ?? null;

  // Si ambos tienen variant_id, comparo SOLO por variant_id (más confiable)
  if (av && bv) return a.product_id === b.product_id && av === bv;

  // Si no hay variant_id (carritos viejos o producto sin variantes), fallback
  return (
    a.product_id === b.product_id &&
    (a.size ?? "") === (b.size ?? "") &&
    (a.color ?? "") === (b.color ?? "") &&
    (a.oz ?? "") === (b.oz ?? "")
  );
}

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const out = [...items];

  const idx = out.findIndex((x) => sameItem(x, item));

  if (idx >= 0) out[idx] = { ...out[idx], qty: out[idx].qty + item.qty };
  else out.push(item);

  saveCart(out);
  return out;
}

export function removeFromCart(items: CartItem[], index: number): CartItem[] {
  const out = items.filter((_, i) => i !== index);
  saveCart(out);
  return out;
}

export function setQty(items: CartItem[], index: number, qty: number): CartItem[] {
  const out = [...items];
  const next = Math.max(0, qty);
  if (next === 0) return removeFromCart(out, index);
  out[index] = { ...out[index], qty: next };
  saveCart(out);
  return out;
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((s, it) => s + it.qty, 0);
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}
