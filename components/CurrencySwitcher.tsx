"use client";

import { StyledSelect } from "@/components/StyledSelect";
import { supportedCurrencies, type DisplayCurrency, useCurrency } from "@/components/CurrencyProvider";

const options = supportedCurrencies.map((value) => ({ value, label: value }));

export function CurrencySwitcher({ mobile = false }: { mobile?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  return <div className={mobile ? "rounded-md bg-surface p-3 shadow-card" : "w-[88px]"}>
    {mobile ? <p className="mb-2 px-1 text-sm font-semibold text-text-dim">Display currency</p> : null}
    <StyledSelect value={currency} options={options} onValueChange={(value) => setCurrency(value as DisplayCurrency)} ariaLabel="Display currency" className="currency-switcher" menuClassName="min-w-[104px]" />
    {mobile ? <p className="mt-2 px-1 text-xs leading-5 text-text-faint">Converted estimates. Shopify confirms the final checkout currency.</p> : null}
  </div>;
}
