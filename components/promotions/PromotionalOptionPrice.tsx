import { formatMoney } from "@/lib/utils/currency";
import type { PromotionOptionPrice } from "@/lib/promotions/optionPricing";

export function PromotionalOptionPrice({ pricing, currencyCode, included = false }: { pricing: PromotionOptionPrice; currencyCode: string; included?: boolean }) {
  // Base/included options (null or $0 catalog delta) must never look like a freebie promo.
  if (!pricing.active) {
    if (included || pricing.catalogDelta === 0) return <>Included</>;
    return <>{priceText(pricing.catalogDelta, currencyCode)}</>;
  }

  return (
    <span className="flex max-w-full flex-col items-start gap-1">
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {pricing.strike ? <s className="text-text-dim">{priceText(pricing.catalogDelta, currencyCode)}</s> : null}
        <span>{formatMoney(0, currencyCode)}</span>
      </span>
      {pricing.promoLabel ? (
        <span className="inline-block max-w-full truncate rounded-full bg-accent-tint px-2 py-0.5 text-xs font-medium leading-4 text-accent" title={pricing.promoLabel}>
          {pricing.promoLabel}
        </span>
      ) : null}
    </span>
  );
}

function priceText(amount: number, currencyCode: string) {
  return amount ? `+ ${formatMoney(amount, currencyCode)}` : formatMoney(0, currencyCode);
}
