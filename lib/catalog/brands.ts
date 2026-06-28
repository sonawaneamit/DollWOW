import brandData from "./brand-data.json";

export type CatalogBrand = {
  value: string;
  label: string;
  collectionHandle: string;
  tags: string[];
  aliases: string[];
};

export const catalogBrands = brandData satisfies CatalogBrand[];

const brandsByValue = new Map(catalogBrands.map((brand) => [brand.value, brand]));
const brandAliasEntries = catalogBrands.flatMap((brand) => [
  [normalizeBrandText(brand.value), brand] as const,
  [normalizeBrandText(brand.label), brand] as const,
  [normalizeBrandText(brand.collectionHandle), brand] as const,
  ...brand.tags.map((tag) => [normalizeBrandText(tag), brand] as const),
  ...brand.aliases.map((alias) => [normalizeBrandText(alias), brand] as const)
]);

const brandsByAlias = new Map(brandAliasEntries);

export function getCatalogBrand(value: string | undefined | null) {
  if (!value) return null;
  return brandsByValue.get(value) ?? brandsByAlias.get(normalizeBrandText(value)) ?? null;
}

export function canonicalBrandValue(value: string | undefined | null) {
  return getCatalogBrand(value)?.value;
}

export function brandFromText(...values: Array<string | undefined | null>) {
  const normalizedValues = values.map((value) => normalizeBrandText(value)).filter(Boolean);

  for (const normalized of normalizedValues) {
    const exact = brandsByAlias.get(normalized);
    if (exact) return exact;
  }

  const haystack = normalizedValues.join(" ");
  if (!haystack) return null;

  const matches = catalogBrands
    .map((brand) => ({
      brand,
      score: [brand.label, brand.value, brand.collectionHandle, ...brand.tags, ...brand.aliases].some((alias) =>
        containsBrandAlias(haystack, normalizeBrandText(alias))
      )
        ? normalizeBrandText(brand.label).length
        : 0
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches[0]?.brand ?? null;
}

export function brandFilterOptions() {
  return catalogBrands.map(({ label, value }) => ({ label, value }));
}

export function brandHubHref(value: string | undefined | null) {
  const brand = getCatalogBrand(value);
  return brand ? `/brands/${brand.collectionHandle}` : "/shop";
}

export function normalizeBrandText(value: string | undefined | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function containsBrandAlias(haystack: string, alias: string) {
  if (!alias) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`).test(haystack);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
