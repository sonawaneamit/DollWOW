const warehouseFlags: Array<{ pattern: RegExp; flag: string; short: string }> = [
  { pattern: /^(united states|united states of america|usa|us|u\.s\.)$/i, flag: "🇺🇸", short: "US" },
  { pattern: /^(european union|eu|europe)$/i, flag: "🇪🇺", short: "EU" },
  { pattern: /^(united kingdom|uk|great britain|gb)$/i, flag: "🇬🇧", short: "UK" },
  { pattern: /^canada$/i, flag: "🇨🇦", short: "Canada" },
  { pattern: /^australia$/i, flag: "🇦🇺", short: "Australia" },
  { pattern: /^china$/i, flag: "🇨🇳", short: "China" }
];

function warehouseLocation(value: string) {
  const clean = value.trim();
  const known = warehouseFlags.find((entry) => entry.pattern.test(clean));
  return known ? { ...known, known: true } : { flag: "◉", short: clean, known: false };
}

export function WarehouseLocationBadge({
  regions,
  country,
  compact = false
}: {
  regions?: string[];
  country?: string;
  compact?: boolean;
}) {
  const locations = Array.from(new Set((regions?.length ? regions : country ? [country] : []).map((value) => value.trim()).filter(Boolean)));
  if (!locations.length) return null;

  return (
    <span className={`warehouse-location-badge${compact ? " is-compact" : ""}`} aria-label={`Warehouse: ${locations.join(", ")}`}>
      <span className="warehouse-location-badge__flags" aria-hidden="true">
        {locations.slice(0, 3).map((value) => {
          const location = warehouseLocation(value);
          return <span key={value} className={location.known ? "is-country-flag" : "is-generic-location"}>{location.flag}</span>;
        })}
      </span>
      <span>{locations.map((value) => warehouseLocation(value).short).join(" · ")}{compact ? "" : " warehouse"}</span>
    </span>
  );
}
