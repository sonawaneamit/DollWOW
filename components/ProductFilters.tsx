import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { activeFilterCount, catalogFilterOptions, getCatalogFilterLabel, type CatalogFilters } from "@/lib/catalog/filters";

const quickLinks = [
  { label: "All", href: "/shop" },
  { label: "WM Dolls", href: "/shop/wm-dolls" },
  { label: "Angelkiss", href: "/shop/angelkiss-dolls" },
  { label: "Irontech", href: "/shop/irontech-dolls" },
  { label: "Starpery", href: "/shop/starpery-dolls" },
  { label: "Piper", href: "/shop/piper-dolls" },
  { label: "SE Doll", href: "/shop/sedoll" },
  { label: "6YE", href: "/shop/6ye-dolls" },
  { label: "Female dolls", href: "/shop/female-dolls" },
  { label: "Male dolls", href: "/shop/male-dolls" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" },
  { label: "Factory order", href: "/shop/custom" },
  { label: "TPE", href: "/shop/tpe" },
  { label: "Silicone", href: "/shop/silicone" },
  { label: "170 cm+", href: "/shop/height-170-plus" }
];

export function ProductFilters({ filters = {}, action = "/shop", resetHref = "/shop" }: { filters?: CatalogFilters; action?: string; resetHref?: string }) {
  const count = activeFilterCount(filters);
  const activeFilters = buildActiveFilterLinks(filters, action);

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

      <form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-8">
        <label className="block sm:col-span-2 lg:col-span-2">
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-ivory-500">Search</span>
          <input
            type="search"
            name="query"
            defaultValue={filters.query || ""}
            placeholder="Brand, height, material, model..."
            className="w-full rounded-[12px] border border-gold-500/18 bg-ink-950/70 px-3 py-2 text-sm text-ivory-100 placeholder:text-ivory-500 focus:border-gold-300 focus:ring-gold-300"
          />
        </label>
        <SelectFilter label="Brand" name="brand" value={filters.brand} options={catalogFilterOptions.brands} />
        <SelectFilter label="Body type" name="bodyType" value={filters.bodyType} options={catalogFilterOptions.bodyTypes} />
        <SelectFilter label="Availability" name="availability" value={filters.availability} options={catalogFilterOptions.availability} />
        <SelectFilter label="Material" name="material" value={filters.material} options={catalogFilterOptions.materials} />
        <SelectFilter label="Height" name="height" value={filters.height} options={catalogFilterOptions.heights} />
        <SelectFilter label="Weight" name="weight" value={filters.weight} options={catalogFilterOptions.weights} />
        <SelectFilter label="Cup size" name="cup" value={filters.cup} options={catalogFilterOptions.cups} />
        <SelectFilter label="Price" name="price" value={filters.price} options={catalogFilterOptions.prices} />
        <SelectFilter label="Sort" name="sort" value={filters.sort || "featured"} options={catalogFilterOptions.sorts} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-8">
          <button type="submit" className="rounded-full bg-gold-300 px-5 py-2 text-sm font-bold text-ink-950 hover:bg-gold-200">
            Apply filters
          </button>
          <Link href={resetHref} className="rounded-full border border-gold-500/22 px-5 py-2 text-sm font-semibold text-ivory-200 hover:border-gold-300/50">
            Reset
          </Link>
        </div>
      </form>

      {activeFilters.length ? (
        <div className="mt-4 border-t border-gold-500/12 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold-300">Active filters</p>
            <Link href={resetHref} className="text-xs font-semibold text-ivory-300 hover:text-ivory-50">
              Clear all
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((item) => (
              <Link
                key={`${item.key}:${item.value}`}
                href={item.href}
                className="rounded-full border border-gold-500/20 bg-ink-950/45 px-3 py-1.5 text-xs font-semibold text-ivory-200 transition hover:border-gold-300/50 hover:text-ivory-50"
              >
                {item.label} <span className="ml-1 text-ivory-500">x</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
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

function buildActiveFilterLinks(filters: CatalogFilters, action: string) {
  const entries = Object.entries(filters).filter(([, value]) => Boolean(value)) as Array<[keyof CatalogFilters, string]>;

  return entries
    .filter(([key, value]) => !(key === "sort" && value === "featured"))
    .map(([key, value]) => {
      const next = new URLSearchParams();
      for (const [entryKey, entryValue] of entries) {
        if (entryKey === key) continue;
        if (entryKey === "sort" && entryValue === "featured") continue;
        next.set(entryKey, entryValue);
      }

      const pathname = action.startsWith("/") ? action : "/shop";
      const href = next.size ? `${pathname}?${next.toString()}` : pathname;
      return {
        key,
        value,
        href,
        label: getCatalogFilterLabel(key, value) || value
      };
    });
}
