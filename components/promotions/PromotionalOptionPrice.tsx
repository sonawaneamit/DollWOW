import { formatMoney } from "@/lib/utils/currency";
import type { PromotionOptionPrice } from "@/lib/promotions/optionPricing";

export function PromotionalOptionPrice({ pricing, currencyCode, included = false }: { pricing: PromotionOptionPrice; currencyCode: string; included?: boolean }) {
  if (!pricing.active) return <>{included ? "Included" : priceText(pricing.catalogDelta, currencyCode)}</>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      {pricing.strike ? <s className="text-text-dim">{priceText(pricing.catalogDelta, currencyCode)}</s> : null}
      <span>{formatMoney(0, currencyCode)}</span>
      {pricing.promoLabel ? <span className="text-accent">{pricing.promoLabel}</span> : null}
    </span>
  );
}

function priceText(amount: number, currencyCode: string) {
  return amount ? `+ ${formatMoney(amount, currencyCode)}` : formatMoney(0, currencyCode);
}
