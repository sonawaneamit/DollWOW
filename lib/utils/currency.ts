export function formatMoney(amount: number | string, currencyCode = "USD") {
  const numeric = typeof amount === "string" ? Number(amount) : amount;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: numeric % 1 === 0 ? 0 : 2
  }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function parseMoney(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (!value) return null;
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}
