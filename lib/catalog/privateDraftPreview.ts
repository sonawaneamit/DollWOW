import 'server-only';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { TemplatePresetDefinition } from '@/lib/customization/template-presets';
import { templateConfigSignature } from '@/lib/customization/template-config-signature';

export async function getPrivateDraftPreview(handle: string): Promise<Product | null> {
  if (process.env.VERCEL_ENV !== 'preview') return null;
  const { default: snapshots } = await import('@/data/draft-previews/castle-oct22.json');
  const product = snapshots.find((entry) => entry.handle === handle);
  return product ? structuredClone(product) as unknown as Product : null;
}

export async function privateDraftRecipe(product: Product, config: BrandCustomizationConfig): Promise<TemplatePresetDefinition | null | undefined> {
  const snapshot = await getPrivateDraftPreview(product.handle);
  if (!snapshot || snapshot.id !== product.id) return undefined;
  if (snapshot.extended.bodyCode === 'S112') return null;
  const chiku = snapshot.extended.bodyCode === 'SZ25';
  return {
    tag: product.tags.find((tag) => tag.startsWith('options:'))!,
    signature: templateConfigSignature(config),
    tiers: [
      { id: 'starter', description: 'The factory-standard construction with your selected finish.', add: [{ groupId: 'body-functions', optionId: 'none' }], remove: [] },
      { id: 'enthusiast', description: chiku ? 'Adds factory-installed body heating.' : 'Adds body heating and 5-point touch moaning.', add: [
        { groupId: 'body-functions', optionId: 'body-heating' },
        ...(!chiku ? [{ groupId: 'body-functions', optionId: 'moaning' }] : [])
      ], remove: [] },
      { id: 'collector', description: chiku ? 'Adds 5-point touch moaning and vaginal suction to the heated build.' : 'Adds the breathing system to the heated, touch-moaning build.', add: chiku ? [
        { groupId: 'body-functions', optionId: 'moaning' }, { groupId: 'body-functions', optionId: 'vaginal-suction' }
      ] : [{ groupId: 'body-functions', optionId: 'breathing' }], remove: [] }
    ]
  };
}
