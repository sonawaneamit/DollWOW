export function resolveApprovedDiscountAmount(input: {
  manualDiscountAmount?: number;
  basePrice: number;
  quotedPrice?: number;
}) {
  if (typeof input.manualDiscountAmount === "number" && Number.isFinite(input.manualDiscountAmount)) {
    return clampCurrency(input.manualDiscountAmount, input.basePrice);
  }
  if (typeof input.quotedPrice !== "number" || !Number.isFinite(input.quotedPrice)) return 0;
  return clampCurrency(input.basePrice - input.quotedPrice, input.basePrice);
}

function clampCurrency(amount: number, max: number) {
  return Math.max(0, Math.min(roundCurrency(amount), roundCurrency(max)));
}

function roundCurrency(amount: number) {
  return Math.round(amount * 100) / 100;
}
