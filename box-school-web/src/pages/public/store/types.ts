export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
};

export type StoreProductVariant = {
  id: number;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  oz?: number | null;
  stock: number;
  price_override?: number | null;
  is_active: boolean;

  // opcional si tu API lo manda
  label?: string;
};

export type StoreProduct = {
  id: number;
  slug: string;
  name: string;
  brand?: string | null;
  category?: StoreCategory | null;

  price: number;
  compare_at_price?: number | null;
  currency: string;

  has_variants?: boolean; // ✅ útil para UI
  total_stock: number;

  image?: string | null;

  // ✅ para variante siempre
  variants?: StoreProductVariant[];
};
