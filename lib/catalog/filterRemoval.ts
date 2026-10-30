import { getCatalogFilterLabel, type CatalogFilters } from "./filters";

export function removableCatalogFilters(
  filters: CatalogFilters,
  preset: CatalogFilters,
  raw: Record<string, string | string[] | undefined>,
  basePath: string
) {
  return Object.entries(filters).flatMap<{ key: string; label: string; href: string | null }>(([key, value]) => {
    if (!value || (key === "sort" && value === "featured")) return [];
    const label = getCatalogFilterLabel(key as keyof CatalogFilters, value);
    if (!label) return [];
    if (key in preset || !raw[key]) return [{ key, label, href: null }];
    const params = new URLSearchParams();
    for (const [name, entry] of Object.entries(raw)) {
      if (name === key || name === "page" || entry === undefined) continue;
      for (const item of Array.isArray(entry) ? entry : [entry]) params.append(name, item);
    }
    const query = params.toString();
    return [{ key, label, href: `${basePath}${query ? `?${query}` : ""}#collection-products` }];
  });
}
