export function moneyPENFromCents(cents?: number | null) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format((cents ?? 0) / 100);
}
