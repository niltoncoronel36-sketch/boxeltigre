export type CartItem = {
  product_id: number;
  slug: string;
  name: string;
  price: number;
  image?: string | null;

  qty: number;
  size?: string;
  color?: string;
};

const KEY = "public_cart_v1";

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const out = [...items];

  const idx = out.findIndex(
    (x) =>
      x.product_id === item.product_id &&
      (x.size ?? "") === (item.size ?? "") &&
      (x.color ?? "") === (item.color ?? "")
  );

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
