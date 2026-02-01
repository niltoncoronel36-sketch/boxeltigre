import { addMonths, ymdFromDate } from "./dates";

export function splitCents(totalCents: number, n: number) {
  const base = Math.floor(totalCents / n);
  const rem = totalCents - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

export function buildCreditSchedule(startYmd: string, payDay: number, cuotas: number, totalCents: number) {
  const start = new Date(startYmd + "T00:00:00");
  if (Number.isNaN(start.getTime())) return [];

  const first = new Date(start);
  first.setDate(payDay);
  if (first < start) first.setMonth(first.getMonth() + 1);

  const amounts = splitCents(totalCents, cuotas);

  return Array.from({ length: cuotas }, (_, i) => {
    const due = addMonths(first, i);
    return {
      idx: i + 1,
      due_on: ymdFromDate(due),
      amount_cents: amounts[i],
    };
  });
}
