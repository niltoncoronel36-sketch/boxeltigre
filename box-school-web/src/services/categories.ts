import { api } from "./api";

export type Category = {
  id: number;
  name: string;
  level: string | null;
  min_age: number | null;
  max_age: number | null;
  capacity: number | null;
  monthly_fee_cents: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Paginator<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type ListCategoriesParams = {
  search?: string;
  active?: "1" | "0" | "";
  page?: number;
  perPage?: number;
};

export async function listCategories(params: ListCategoriesParams): Promise<Paginator<Category>> {
  const res = await api.get<Paginator<Category>>("/categories", {
    params: {
      search: params.search || "",
      active: params.active ?? "1",
      page: params.page ?? 1,
      per_page: params.perPage ?? 100,
    },
  });
  return res.data;
}

export async function listActiveCategories(): Promise<Category[]> {
  const res = await listCategories({ active: "1", perPage: 100 });
  return res.data;
}
