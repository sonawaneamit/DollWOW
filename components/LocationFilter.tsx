"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import type { CatalogFilters } from "@/lib/catalog/filters";

const locationOptions = [
  { label: "All", value: undefined, flag: "🌐" },
  { label: "United States", value: "us", flag: "🇺🇸" },
  { label: "Canada", value: "ca", flag: "🇨🇦" },
  { label: "Europe", value: "eu", flag: "🇪🇺" }
] as const;

export function LocationFilter({ currentRegion, basePath }: { currentRegion?: CatalogFilters["region"]; basePath: string }) {
  const searchParams = useSearchParams();

  function buildHref(regionValue: string | undefined) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (regionValue) {
      params.set("region", regionValue);
    } else {
      params.delete("region");
    }
    
    return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
  }

  return (
    <div className="location-filter">
      <div className="location-filter__header">
        <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
        <span className="location-filter__title">Filter by warehouse location</span>
      </div>
      <div className="location-filter__options" role="group" aria-label="Warehouse location filter">
        {locationOptions.map((option) => {
          const isActive = currentRegion === option.value;
          const href = buildHref(option.value);
          
          return (
            <Link
              key={option.value || "all"}
              href={href}
              scroll={false}
              className={`location-filter__chip ${isActive ? "location-filter__chip--active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="location-filter__chip-flag" aria-hidden="true">{option.flag}</span>
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
