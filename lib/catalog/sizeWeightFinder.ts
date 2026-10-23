import type { Product } from '@/types/product';
import { filterProducts } from '@/lib/catalog/filters';
import { isMdReleaseWeight, mdFactoryBodyKg } from '@/lib/catalog/mdWeight';

export const finderMaterials = [
  { value: 'tpe', label: 'TPE' },
  { value: 'silicone', label: 'Silicone' },
  { value: 'hybrid', label: 'Hybrid / silicone-head listing' },
] as const;
export type FinderMaterial = typeof finderMaterials[number]['value'];
export type FinderWeightBasis = 'factory-body-only' | 'unspecified';
export type FinderRow = {
  id: string; handle: string; title: string; heightCm: number;
  material: FinderMaterial; weightLb: number | null; basis: FinderWeightBasis;
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
      id: p.id, handle: p.handle, title: p.title,
      heightCm: p.extended.heightCm!, material: matches[0].value,
      weightLb: Number.isFinite(p.extended.weightLb) && p.extended.weightLb! > 0 ? p.extended.weightLb! : null,
      basis: bodyOnly ? 'factory-body-only' : 'unspecified',
    });
  }
  return { rows, sourceListings: products.length, candidates: candidates.length, excludedHolds, excludedMaterial };
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
