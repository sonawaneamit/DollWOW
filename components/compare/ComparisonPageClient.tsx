"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Scale, ShoppingCart, Trash2 } from "lucide-react";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { useCart } from "@/components/cart/CartProvider";
import { useMounted } from "@/lib/utils/storageStore";
import { useComparison } from "./ComparisonProvider";

export function ComparisonPageClient() {
  const comparison = useComparison();
  const cart = useCart();
  const mounted = useMounted();
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const measurementLabels = useMemo(() => [...new Set(comparison.entries.flatMap((entry) => Object.keys(entry.measurements || {})))], [comparison.entries]);
  const rows = [
    { group: "At a glance", label: "Material", value: (entry: typeof comparison.entries[number]) => entry.material },
    { group: "At a glance", label: "Product type", value: (entry: typeof comparison.entries[number]) => entry.productType },
    { group: "At a glance", label: "Availability", value: (entry: typeof comparison.entries[number]) => entry.stockStatus === "ready_to_ship" ? "Ready to ship" : "Factory order" },
    { group: "Size and handling", label: "Height", value: (entry: typeof comparison.entries[number]) => entry.heightCm ? `${entry.heightCm} cm` : undefined },
    { group: "Size and handling", label: "Weight", value: (entry: typeof comparison.entries[number]) => entry.weightLb ? `${entry.weightLb} lb` : undefined },
    { group: "Size and handling", label: "Cup size", value: (entry: typeof comparison.entries[number]) => entry.cupSize },
    ...measurementLabels.map((label) => ({ group: "Measurements", label, value: (entry: typeof comparison.entries[number]) => entry.measurements?.[label] })),
    { group: "Ordering", label: "Warehouse", value: (entry: typeof comparison.entries[number]) => entry.warehouseRegions?.join(", ") },
    { group: "Ordering", label: "Customization", value: (entry: typeof comparison.entries[number]) => entry.customAvailable ? "Available" : entry.stockStatus === "ready_to_ship" ? "Fixed warehouse build" : "Confirm on product page" }
  ];
  const visibleRows = differencesOnly
    ? rows.filter((row) => new Set(comparison.entries.map((entry) => String(row.label === "Price" ? entry.unitPrice : row.value(entry) ?? ""))).size > 1)
    : rows;

  if (!mounted) return <div className="min-h-[420px]" />;
  if (comparison.entries.length < 2) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-6">
        <Scale className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-5 font-display text-4xl font-semibold text-text">Compare dolls side by side</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-text-dim">Choose at least two dolls from the catalog. You can compare up to four at once.</p>
        <Link href="/shop" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-button bg-accent px-6 text-base font-semibold text-white shadow-card">Browse dolls <ArrowRight className="h-4 w-4" /></Link>
      </section>
    );
  }

  let lastGroup = "";
  return (
    <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-accent">PRODUCT COMPARISON</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-text sm:text-5xl">Compare your shortlist</h1>
          <p className="mt-3 text-base text-text-dim">Photos, measurements, ordering details, and current starting prices in one view.</p>
        </div>
        <button type="button" onClick={() => setDifferencesOnly((value) => !value)} aria-pressed={differencesOnly} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-button border border-border-strong px-4 text-sm font-semibold text-text hover:bg-surface-tint">
          <span className={`flex h-5 w-5 items-center justify-center rounded-sm border ${differencesOnly ? "border-accent bg-accent text-white" : "border-border-strong"}`}>{differencesOnly ? <Check className="h-3.5 w-3.5" /> : null}</span>
          Show differences only
        </button>
      </header>

      <p className="mt-6 text-sm font-semibold text-text-dim sm:hidden">Swipe sideways to compare each doll →</p>
      <div className="comparison-table-shell mt-3 overflow-x-auto rounded-lg border border-border bg-surface shadow-card sm:mt-8">
        <table className="comparison-table w-full table-fixed border-collapse text-left" style={{ minWidth: `${160 + comparison.entries.length * 260}px` }}>
          <thead className="comparison-table__head sticky top-0 z-20 bg-surface shadow-sm">
            <tr>
              <th className="comparison-table__corner sticky left-0 z-30 w-40 border-b border-r border-border bg-surface-tint p-4 align-middle text-sm font-semibold text-text-dim">Product</th>
              {comparison.entries.map((entry) => (
                <th key={entry.productHandle} className="comparison-product-head border-b border-r border-border p-3 align-top last:border-r-0">
                  <div className="grid grid-cols-[64px_minmax(0,1fr)_44px] items-start gap-3">
                    <Link href={`/products/${entry.productHandle}`} className="relative block aspect-[4/5] w-16 overflow-hidden rounded-sm bg-surface-tint">
                      {entry.imageUrl ? <Image src={entry.imageUrl} alt={entry.productTitle} fill sizes="64px" className="object-contain object-top" /> : null}
                    </Link>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{entry.brand}</p>
                      <Link href={`/products/${entry.productHandle}`} className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 text-text hover:text-accent">{entry.productTitle}</Link>
                      <p className="mt-1 text-base font-semibold text-text"><DisplayMoney amount={entry.unitPrice} currencyCode={entry.currencyCode} /></p>
                    </div>
                    <button type="button" onClick={() => comparison.remove(entry.productHandle)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-text-dim hover:bg-surface-tint hover:text-danger" aria-label={`Remove ${entry.productTitle}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {entry.merchandiseId ? <button type="button" onClick={() => cart.addItem({ merchandiseId: entry.merchandiseId!, productHandle: entry.productHandle, productTitle: entry.productTitle, brand: entry.brand, imageUrl: entry.imageUrl, unitPrice: entry.unitPrice, currencyCode: entry.currencyCode, readyToShip: entry.stockStatus === "ready_to_ship" })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-accent px-2 text-xs font-semibold text-white"><ShoppingCart className="h-4 w-4" /> Add to Cart</button> : <span />}
                    <Link href={`/products/${entry.productHandle}`} className="inline-flex min-h-11 items-center justify-center rounded-button border border-border-strong px-3 text-sm font-semibold text-text">View details</Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const showGroup = row.group !== lastGroup;
              lastGroup = row.group;
              return [
                showGroup ? <tr key={`${row.group}-heading`}><th colSpan={comparison.entries.length + 1} className="border-b border-border bg-surface-tint px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent">{row.group}</th></tr> : null,
                <tr key={`${row.group}-${row.label}`}>
                  <th className="sticky left-0 z-10 border-b border-r border-border bg-surface-tint px-4 py-3 text-sm font-semibold text-text">{row.label}</th>
                  {comparison.entries.map((entry) => <td key={entry.productHandle} className="border-b border-r border-border px-4 py-3 text-sm leading-6 text-text-dim last:border-r-0">{row.value(entry) || <span className="text-text-faint">Not provided</span>}</td>)}
                </tr>
              ];
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/shop" className="font-semibold text-accent">Add another doll</Link>
        <button type="button" onClick={comparison.clear} className="text-sm font-semibold text-text-dim hover:text-text">Clear comparison</button>
      </div>
    </section>
  );
}
