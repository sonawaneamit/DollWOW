import Link from "next/link";
import { X } from "lucide-react";
import type { CatalogFilters } from "@/lib/catalog/filters";
import { removableCatalogFilters } from "@/lib/catalog/filterRemoval";

export function ActiveCatalogFilters({ filters, preset, raw, basePath }: {
  filters: CatalogFilters;
  preset: CatalogFilters;
  raw: Record<string, string | string[] | undefined>;
  basePath: string;
}) {
  const items = removableCatalogFilters(filters, preset, raw, basePath);
  return <nav aria-label="Active filters" className="mb-4 flex flex-wrap gap-2">
    {items.map(item => item.href ? <Link key={item.key} href={item.href}
      aria-label={`Remove ${item.label} filter`} title={`Remove ${item.label} filter`}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text hover:border-accent">
      <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item.label}</span>
      <X aria-hidden="true" className="h-4 w-4 shrink-0" />
    </Link> : <span key={item.key} className="inline-flex min-h-11 max-w-full items-center rounded-lg border border-border px-3 py-2 text-sm text-text-dim">{item.label}</span>)}
  </nav>;
}
