import 'server-only';
import snapshots from '@/data/draft-previews/firefly-mary.json';
import recipes from '@/data/draft-previews/firefly-mary-recipes.json';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { TemplatePresetDefinition } from '@/lib/customization/template-presets';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';

export function fireflyDraftPreviewEnabled() {
  return process.env.VERCEL_ENV === 'preview' && process.env.NEXT_PUBLIC_DOL262_PREVIEW === '1';
}

export function fireflyPreviewNote(handle: string) {
  const common = 'Private review: existing draft prices and menus, not a purchasable offer. Production takes 21-30 business days; destination transit and duties remain unconfirmed.';
  if (handle === 'firefly-mary-164cm-normal-silicone-companion-doll') return `${common} Body-version hold: saved weight 36kg differs from the newer master 30kg. Do not publish until the exact body is matched.`;
  if (handle === 'firefly-mary-165cm-max-silicone-companion-doll') return `${common} Body-version hold: saved 37.5kg/D-Cup differs from the newer master 34kg/65B. Do not publish until the exact body is matched.`;
  return common;
}

export function fireflyDraftPreviewProducts(): Product[] {
  if (!fireflyDraftPreviewEnabled()) return [];
  return snapshots.map(snapshot => ({...structuredClone(snapshot),
    extended:{...structuredClone(snapshot.extended),qcNote:fireflyPreviewNote(snapshot.handle)}})) as unknown as Product[];
}

export function fireflyDraftPreviewProduct(handle: string) {
  return fireflyDraftPreviewProducts().find(product => product.handle === handle) ?? null;
}

export function isFireflyDraftPreviewProduct(product: Pick<Product,'id'|'handle'>) {
  return fireflyDraftPreviewEnabled() && snapshots.some(p => p.id === product.id && p.handle === product.handle);
}

export function fireflyDraftRecipe(product: Product, config: BrandCustomizationConfig): TemplatePresetDefinition | null {
  if (!isFireflyDraftPreviewProduct(product)) return null;
  const tag=product.tags.find(tag=>Object.hasOwn(recipes,tag));
  const recipe=tag ? (recipes as Record<string, unknown>)[tag] : null;
  return recipe ? {...structuredClone(recipe) as TemplatePresetDefinition,signature:templateConfigSignature(config)} : null;
}
