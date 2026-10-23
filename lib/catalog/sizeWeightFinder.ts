import type { Product } from '@/types/product';
import { filterProducts } from '@/lib/catalog/filters';
import { isMdReleaseWeight, mdFactoryBodyKg } from '@/lib/catalog/mdWeight';
import { protectedProductImageUrlFor } from '@/lib/catalog/productImage';
import { productPublicTitle } from '@/lib/catalog/naming';

export const finderMaterials = [
  { value: 'tpe', label: 'TPE' },
  { value: 'silicone', label: 'Silicone' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;
export type FinderMaterial = typeof finderMaterials[number]['value'];
export type FinderWeightBasis = 'factory-body-only' | 'unspecified';
export type FinderRow = {
  id: string; handle: string; title: string; heightCm: number;
  material: FinderMaterial; weightLb: number | null; basis: FinderWeightBasis;
  image: string | null; price: string | null; currency: string;
};

export function buildFinderRows(products: Product[]) {
  const full = filterProducts(products, { productForm: 'full-doll' });
  const candidates = full.filter(p => Number.isFinite(p.extended.heightCm) && p.extended.heightCm! >= 140);
  const rows: FinderRow[] = [];
  let excludedHolds = 0;
  let excludedMaterial = 0;
  const seen = new Set<string>();
  for (const p of candidates) {
    if (p.tags.some(tag => /hold|dollwow-test|dollwow-system|custom-option-charge/i.test(tag))) {
      excludedHolds++;
      continue;
    }
    const matches = finderMaterials.filter(({ value }) => filterProducts([p], { material: value }).length === 1);
    if (matches.length !== 1) { excludedMaterial++; continue; }
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    const bodyOnly = isMdReleaseWeight(p) && mdFactoryBodyKg(p.extended.brand || p.vendor, p.extended.measurements) !== undefined;
    rows.push({
      id: p.id, handle: p.handle, title: productPublicTitle(p),
      heightCm: p.extended.heightCm!, material: matches[0].value,
      weightLb: Number.isFinite(p.extended.weightLb) && p.extended.weightLb! > 0 ? p.extended.weightLb! : null,
      basis: bodyOnly ? 'factory-body-only' : 'unspecified',
      image: protectedProductImageUrlFor(p, p.featuredImage ?? p.images[0], 'card') ?? null,
      price: Number.isFinite(Number(p.priceRange.minVariantPrice.amount)) && Number(p.priceRange.minVariantPrice.amount) > 0 ? p.priceRange.minVariantPrice.amount : null,
      currency: p.priceRange.minVariantPrice.currencyCode,
    });
  }
  return { rows, sourceListings: products.length, candidates: candidates.length, excludedHolds, excludedMaterial };
}

export type FinderCard = Omit<FinderRow, 'basis' | 'weightLb'> & { weightLb: number };
export type FinderRanges = { minHeight: number; maxHeight: number; minWeight: number; maxWeight: number; materials: FinderMaterial[] };
export type FinderBounds = Omit<FinderRanges, 'materials'>;
export type FinderParams = Record<string, string | string[] | undefined>;
export const finderKg = (lb: number) => Math.round(lb / 2.2046226218 * 10) / 10;

export function finderCards(rows: FinderRow[]): FinderCard[] {
  return rows.flatMap(row => row.weightLb !== null && Number.isFinite(row.weightLb) && row.weightLb > 0 ? [{
    id: row.id, handle: row.handle, title: row.title, heightCm: row.heightCm, material: row.material,
    weightLb: row.weightLb, image: row.image, price: row.price, currency: row.currency,
  }] : []);
}

export function finderBounds(rows: FinderCard[]): FinderBounds {
  return { minHeight: 140, maxHeight: Math.max(141, ...rows.map(row => Math.ceil(row.heightCm))),
    minWeight: rows.length ? Math.min(...rows.map(row => finderKg(row.weightLb))) : 0,
    maxWeight: Math.max(1, ...rows.map(row => Math.ceil(finderKg(row.weightLb)))) };
}

export function finderRanges(params: FinderParams, bounds: FinderBounds): FinderRanges {
  const read = (key: keyof FinderBounds, value: number, min: number, max: number) => {
    const raw = params[key];
    const parsed = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : value;
  };
  const heights = [read('minHeight', bounds.minHeight, bounds.minHeight, bounds.maxHeight), read('maxHeight', bounds.maxHeight, bounds.minHeight, bounds.maxHeight)].sort((a, b) => a - b);
  const weights = [read('minWeight', bounds.minWeight, bounds.minWeight, bounds.maxWeight), read('maxWeight', bounds.maxWeight, bounds.minWeight, bounds.maxWeight)].sort((a, b) => a - b);
  const materials = typeof params.material === 'string' ? [params.material] : params.material ?? [];
  return { minHeight: heights[0], maxHeight: heights[1], minWeight: weights[0], maxWeight: weights[1],
    materials: finderMaterials.map(option => option.value).filter(value => materials.includes(value)) };
}

export function filterFinderCards(rows: FinderCard[], ranges: FinderRanges) {
  return rows.filter(row => row.heightCm >= ranges.minHeight && row.heightCm <= ranges.maxHeight &&
    finderKg(row.weightLb) >= ranges.minWeight && finderKg(row.weightLb) <= ranges.maxWeight &&
    (!ranges.materials.length || ranges.materials.includes(row.material)));
}

export function finderQuery(ranges: FinderRanges, page = 1) {
  const params = new URLSearchParams({ minHeight: String(ranges.minHeight), maxHeight: String(ranges.maxHeight), minWeight: String(ranges.minWeight), maxWeight: String(ranges.maxWeight) });
  ranges.materials.forEach(value => params.append('material', value));
  if (page > 1) params.set('page', String(page));
  return `/tools/doll-size-weight-finder?${params}`;
}

export function finderSummary(rows: FinderRow[], heightCm: number, material: FinderMaterial) {
  const matches = rows.filter(row => row.heightCm === heightCm && row.material === material);
  const ranges = (['unspecified', 'factory-body-only'] as const).map(basis => {
    const measured = matches.filter(row => row.basis === basis && row.weightLb !== null);
    return { basis, count: measured.length, minLb: measured.length ? Math.min(...measured.map(row => row.weightLb!)) : null,
      maxLb: measured.length ? Math.max(...measured.map(row => row.weightLb!)) : null };
  });
  return { matches, ranges, missing: matches.filter(row => row.weightLb === null).length };
}

export function finderWeight(valueLb: number) {
  return `${(valueLb / 2.2046226218).toFixed(1)} kg / ${valueLb.toFixed(1)} lb`;
}

export function finderHeight(cm: number) {
  const inches = Math.round(cm / 2.54);
  return `${cm} cm / ${Math.floor(inches / 12)} ft ${inches % 12} in`;
}
