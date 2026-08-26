"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { CatalogFilters } from "@/lib/catalog/filters";

const locationOptions = [
  { label: "All", value: undefined },
  { label: "United States", value: "us" },
  { label: "Canada", value: "ca" },
  { label: "Europe", value: "eu" }
] as const;

export function LocationFilter({ currentRegion, basePath }: { currentRegion?: CatalogFilters["region"]; basePath: string }) {
  return (
    <div className="location-filter">
      <div className="location-filter__header">
        <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
        <span className="location-filter__title">Filter by warehouse location</span>
      </div>
      <div className="location-filter__options" role="group" aria-label="Warehouse location filter">
        {locationOptions.map((option) => {
          const isActive = currentRegion === option.value;
          const href = option.value ? `${basePath}?region=${option.value}` : basePath;
          
          return (
            <Link
              key={option.value || "all"}
              href={href}
              scroll={false}
              className={`location-filter__chip ${isActive ? "location-filter__chip--active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
