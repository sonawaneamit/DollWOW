import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { activeFilterCount, catalogFilterOptions, type CatalogFilters } from "@/lib/catalog/filters";

const quickLinks = [
  { label: "All", href: "/shop" },
  { label: "WM Dolls", href: "/shop/wm-dolls" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" },
  { label: "Factory order", href: "/shop/custom" },
  { label: "TPE", href: "/shop/tpe" },
  { label: "Silicone", href: "/shop/silicone" },
  { label: "170 cm+", href: "/shop/height-170-plus" }
];

export function ProductFilters({ filters = {}, action = "/shop", resetHref = "/shop" }: { filters?: CatalogFilters; action?: string; resetHref?: string }) {
  const count = activeFilterCount(filters);

  return (
    <div className="w-full rounded-[18px] border border-gold-500/14 bg-ink-800/72 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] lg:max-w-4xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ivory-100">
          <SlidersHorizontal className="h-4 w-4 text-gold-300" />
          Catalog filters
          {count ? <span className="rounded-full bg-gold-300/12 px-2 py-0.5 text-xs text-gold-200">{count} active</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="rounded-full border border-gold-500/18 bg-ink-950/35 px-3 py-1.5 text-xs font-semibold text-ivory-300 hover:border-gold-300/50 hover:text-ivory-50"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <SelectFilter label="Brand" name="brand" value={filters.brand} options={catalogFilterOptions.brands} />
        <SelectFilter label="Availability" name="availability" value={filters.availability} options={catalogFilterOptions.availability} />
        <SelectFilter label="Material" name="material" value={filters.material} options={catalogFilterOptions.materials} />
        <SelectFilter label="Height" name="height" value={filters.height} options={catalogFilterOptions.heights} />
        <SelectFilter label="Weight" name="weight" value={filters.weight} options={catalogFilterOptions.weights} />
        <SelectFilter label="Sort" name="sort" value={filters.sort || "featured"} options={catalogFilterOptions.sorts} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="rounded-full bg-gold-300 px-5 py-2 text-sm font-bold text-ink-950 hover:bg-gold-200">
            Apply filters
          </button>
          <Link href={resetHref} className="rounded-full border border-gold-500/22 px-5 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options
}: {
  label: string;
  name: keyof CatalogFilters;
  value?: string;
  options: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-ivory-500">{label}</span>
      <select
        name={name}
        defaultValue={value || (name === "sort" ? "featured" : "")}
        className="w-full rounded-[12px] border border-gold-500/18 bg-ink-950/70 px-3 py-2 text-sm text-ivory-100 focus:border-gold-300 focus:ring-gold-300"
      >
        {name === "sort" ? null : <option value="">Any</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
