export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
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

  total_stock: number;
  image?: string | null;
};
