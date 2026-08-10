"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type DisplayCurrency = (typeof supportedCurrencies)[number];
const fallbackRates: Record<DisplayCurrency, number> = { USD: 1, EUR: 0.86, GBP: 0.75, CAD: 1.37, AUD: 1.53 };

type Value = { currency: DisplayCurrency; setCurrency: (value: DisplayCurrency) => void; format: (amount: number | string, source?: string) => string };
const CurrencyContext = createContext<Value | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrent] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<Record<DisplayCurrency, number>>(fallbackRates);
  useEffect(() => {
    const saved = localStorage.getItem("dollwow-display-currency");
    if (supportedCurrencies.includes(saved as DisplayCurrency)) setCurrent(saved as DisplayCurrency);
    fetch("/api/currency/rates").then((r) => r.ok ? r.json() : null).then((p: { rates?: Partial<Record<DisplayCurrency, number>> } | null) => {
      if (p?.rates) setRates((current) => ({ ...current, ...p.rates }));
    }).catch(() => undefined);
  }, []);
  const value = useMemo<Value>(() => ({
    currency,
    setCurrency(next) { setCurrent(next); localStorage.setItem("dollwow-display-currency", next); },
    format(amount, source = "USD") {
      const number = typeof amount === "string" ? Number(amount) : amount;
      const converted = (Number.isFinite(number) ? number : 0) / (rates[source as DisplayCurrency] || 1) * rates[currency];
      return new Intl.NumberFormat(currency === "USD" ? "en-US" : undefined, { style: "currency", currency, maximumFractionDigits: converted % 1 ? 2 : 0 }).format(converted);
    }
  }), [currency, rates]);
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() { const value = useContext(CurrencyContext); if (!value) throw new Error("CurrencyProvider is missing"); return value; }
export function DisplayMoney({ amount, currencyCode = "USD", className }: { amount: number | string; currencyCode?: string; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(amount, currencyCode)}</span>;
}
