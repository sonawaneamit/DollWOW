"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { brandHubHref } from "@/lib/catalog/brands";
import { activeFilterCount, catalogFilterOptions, getCatalogFilterLabel, type CatalogFilters } from "@/lib/catalog/filters";

const quickLinks = [
  { label: "All", href: "/shop" },
  { label: "Sex dolls", href: "/shop/sex-dolls" },
  { label: "Realistic", href: "/shop/realistic-sex-dolls" },
  { label: "Mini", href: "/shop/mini-sex-dolls" },
  ...catalogFilterOptions.brands.map((brand) => ({ label: brand.label, href: brandHubHref(brand.value) })),
  { label: "Female dolls", href: "/shop/female-dolls" },
  { label: "Male dolls", href: "/shop/male-dolls" },
  { label: "Ready to ship", href: "/shop/ready-to-ship" },
  { label: "Factory order", href: "/shop/custom" },
  { label: "Blonde", href: "/shop/blonde-dolls" },
  { label: "Asian look", href: "/shop/asian-dolls" },
  { label: "Curvy", href: "/shop/curvy-dolls" },
  { label: "TPE", href: "/shop/tpe" },
  { label: "Silicone", href: "/shop/silicone" },
  { label: "170 cm+", href: "/shop/height-170-plus" }
];

export function ProductFilters({
  filters = {},
  action = "/shop",
  resetHref = "/shop",
  variant = "bar"
}: {
  filters?: CatalogFilters;
  action?: string;
  resetHref?: string;
  variant?: "bar" | "sidebar";
}) {
  const router = useRouter();
  const count = activeFilterCount(filters);
  const activeFilters = buildActiveFilterLinks(filters, action);
  const isSidebar = variant === "sidebar";

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    for (const [key, rawValue] of new FormData(event.currentTarget).entries()) {
      const value = String(rawValue).trim();
      if (!value || (key === "sort" && value === "featured")) continue;
      next.set(key, value);
    }
    router.push(next.size ? `${action}?${next.toString()}` : action);
  }

  return (
    <div className={`product-filters ${isSidebar ? "product-filters--sidebar" : "product-filters--bar"}`}>
      <div className="product-filters__top">
        <div className="product-filters__title">
          <SlidersHorizontal className="h-4 w-4 text-gold-300" />
          Catalog filters
          {count ? <span>{count} active</span> : null}
        </div>
        <div className="product-filters__quicklinks">
          <Link href="/authorized-vendors" className="product-filters__chip inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3.5 w-3.5" /> Certificates
          </Link>
          {quickLinks.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="product-filters__chip"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <form action={action} onSubmit={applyFilters} className={`product-filters__form ${isSidebar ? "product-filters__form--sidebar" : ""}`}>
        <label className="product-filter-control product-filter-control--search">
          <span>Search</span>
          <input
            type="search"
            name="query"
            defaultValue={filters.query || ""}
            placeholder="Brand, height, material, model..."
            className="product-filter-input"
          />
        </label>
        {isSidebar ? <FilterActions resetHref={resetHref} autoApply /> : null}
        <SelectFilter label="Brand" name="brand" value={filters.brand} options={catalogFilterOptions.brands} />
        <SelectFilter label="Look" name="look" value={filters.look} options={catalogFilterOptions.looks} />
        <SelectFilter label="Body type" name="bodyType" value={filters.bodyType} options={catalogFilterOptions.bodyTypes} />
        <SelectFilter label="Availability" name="availability" value={filters.availability} options={catalogFilterOptions.availability} />
        <SelectFilter label="Material" name="material" value={filters.material} options={catalogFilterOptions.materials} />
        <SelectFilter label="Product form" name="productForm" value={filters.productForm} options={catalogFilterOptions.productForms} />
        <SelectFilter label="Height" name="height" value={filters.height} options={catalogFilterOptions.heights} />
        <SelectFilter label="Weight" name="weight" value={filters.weight} options={catalogFilterOptions.weights} />
        <SelectFilter label="Cup size" name="cup" value={filters.cup} options={catalogFilterOptions.cups} />
        <SelectFilter label="Price" name="price" value={filters.price} options={catalogFilterOptions.prices} />
        <SelectFilter label="Sort" name="sort" value={filters.sort || "featured"} options={catalogFilterOptions.sorts} />
        {!isSidebar ? <FilterActions resetHref={resetHref} /> : null}
      </form>

      {activeFilters.length ? (
        <div className="product-filters__active">
          <div className="product-filters__active-head">
            <p>Active filters</p>
            <Link href={resetHref}>
              Clear all
            </Link>
          </div>
          <div className="product-filters__active-list">
            {activeFilters.map((item) => (
              <Link
                key={`${item.key}:${item.value}`}
                href={item.href}
                className="product-filters__active-pill"
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

function FilterActions({ resetHref, autoApply = false }: { resetHref: string; autoApply?: boolean }) {
  return (
    <div className="product-filters__actions">
      <button type="submit" className="product-filters__submit">
        Apply filters
      </button>
      <Link href={resetHref} className="product-filters__reset">
        Reset
      </Link>
      {autoApply ? <span className="product-filters__auto-note">Dropdowns update automatically</span> : null}
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
  function applySelection(event: ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <label className="product-filter-control">
      <span>{label}</span>
      <span className="product-filter-select-wrap">
        <select
          name={name}
          defaultValue={value || (name === "sort" ? "featured" : "")}
          className="product-filter-input product-filter-select"
          onChange={applySelection}
        >
          {name === "sort" ? null : <option value="">Any</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="product-filter-select-icon" aria-hidden="true" />
      </span>
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
