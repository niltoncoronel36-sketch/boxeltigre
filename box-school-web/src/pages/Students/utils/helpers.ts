import { todayYmd, toYmd } from "./dates";

export type EnrollmentStatusLite = "active" | "paused" | "ended";

export function formatName(s: { first_name?: string; last_name?: string }): string {
  return `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function strOrNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export function statusLabel(s: EnrollmentStatusLite): string {
  if (s === "active") return "Activa";
  if (s === "paused") return "Pausada";
  return "Finalizada";
}

export function categoryLabel(c: { name: string; level?: string | null }): string {
  const lvl = String(c.level ?? "").trim();
  return lvl && lvl !== "general" ? `${c.name} (${lvl})` : c.name;
}

type EnrollmentLike = {
  id: number;
  status: EnrollmentStatusLite;
  starts_on?: any;
  ends_on?: any;
};

export function getCurrentEnrollment(list: EnrollmentLike[]): EnrollmentLike | null {
  const today = todayYmd();

  const actives = list.filter((e) => {
    if (e.status !== "active") return false;
    const ends = toYmd(e.ends_on);
    return !ends || ends >= today;
  });

  actives.sort((a, b) => {
    const as = toYmd(a.starts_on) || "0000-00-00";
    const bs = toYmd(b.starts_on) || "0000-00-00";
    if (as === bs) return (b.id ?? 0) - (a.id ?? 0);
    return bs.localeCompare(as);
  });

  return actives[0] ?? null;
}

export function getMonthlyFeeCents(
  enr: { category?: any; category_id?: number | null },
  categories: Array<{ id: number; monthly_fee_cents?: number | null }>
): number {
  const catId = (enr as any)?.category?.id ?? (enr as any)?.category_id;
  if (!catId) return 0;
  const n = Number(catId);
  const c = categories.find((x) => Number(x.id) === n);
  return Number((c as any)?.monthly_fee_cents ?? 0);
}
