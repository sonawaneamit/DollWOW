import type { Product } from '@/types/product';
import { gynoidBodyVersionMapping } from '@/lib/catalog/gynoid-body-versions';

export function GynoidBodyVersionNote({ product }: { product: Product }) {
  const row = gynoidBodyVersionMapping(product);
  if (!row) return null;
  return <aside role="note" aria-label="Gynoid body version details" className="mb-6 border-l-2 border-accent pl-4 text-sm leading-6 text-text-dim">
    <p>Standard and Deluxe are body constructions. Deluxe adds factory life-cast hand and foot detailing, not a different head or a softness upgrade.</p>
    <p className="mt-2">{row.model === 'M13'
      ? 'Standard body: 30 kg (66.1 lb), bust 89 cm (35.0 in). Deluxe body: 32 kg (70.5 lb), bust 91 cm (35.8 in).'
      : 'Standard and Deluxe bodies: 30 kg (66.1 lb).'} Body weights exclude the head and vary by +/-3 kg (6.6 lb).</p>
    <p className="mt-2">The family photos and other listed dimensions show the Standard body. No separate Deluxe photo is shown.</p>
  </aside>;
}
