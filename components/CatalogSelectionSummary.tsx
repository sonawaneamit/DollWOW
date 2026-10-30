import Link from "next/link";
import type { Product } from "@/types/product";

export function batchCSelectionSummaryEnabled(path: string) {
  return process.env.VERCEL_ENV === "preview" && process.env.DOL229_BUYER_SUMMARY === "1" &&
    ["/brands/erovenus-dolls", "/brands/climax-dolls", "/shop/curvy-dolls", "/shop/brunette-dolls"].includes(path);
}

export function CatalogSelectionSummary({ products }: { products: Product[] }) {
  if (!products.length) return null;
  const money = products.map(product => product.priceRange.minVariantPrice);
  const currency = money[0].currencyCode;
  if (!/^[A-Z]{3}$/.test(currency) || money.some(price => price.currencyCode !== currency || !price.amount.trim() || !Number.isFinite(Number(price.amount)) || Number(price.amount) <= 0)) return null;
  const amounts = money.map(price => Number(price.amount));
  const min = Math.min(...amounts), max = Math.max(...amounts);
  const format = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
  return <div className="mt-3 text-sm leading-5" data-testid="catalog-selection-summary">
    <p className="font-semibold text-gold-200">Starting prices on this page: {format.format(min)}{max !== min ? ` to ${format.format(max)}` : ""} {currency}</p>
    <p className="mt-1 text-text-dim">Shipping, taxes, and any custom options are confirmed at checkout. <Link href="/shipping" className="underline underline-offset-4">Shipping details</Link></p>
  </div>;
}
