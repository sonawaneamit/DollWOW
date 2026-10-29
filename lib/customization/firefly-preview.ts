import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationRule } from '@/types/customization';

const reviewedDrafts: Record<string, string> = {
  'firefly-mary-160cm-max-silicone-companion-doll': 'gid://shopify/Product/10639456305336',
  'firefly-mary-164cm-normal-silicone-companion-doll': 'gid://shopify/Product/10639456960696',
  'firefly-mary-165cm-max-silicone-companion-doll': 'gid://shopify/Product/10639457059000',
  'firefly-mary-164cm-max-silicone-companion-doll': 'gid://shopify/Product/10639457124536'
};

export function withFireflyPreviewRules(product: Product, config: BrandCustomizationConfig): BrandCustomizationConfig {
  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
  if (environment !== 'preview' || process.env.NEXT_PUBLIC_DOL262_PREVIEW !== '1'
    || reviewedDrafts[product.handle] !== product.id || !product.extended.previewCustomizationFixture) return config;
  // Retained from the four reviewed 6 October menu candidates, not inferred from labels.
  const rules: CustomizationRule[] = ['standing-free', 'standing-without-bolts-orig-120-free'].map(optionId => ({
    id: `firefly-loose-${optionId}`,
    type: 'incompatible',
    when: {groupId: 'premium-body-options-multiple', optionId: 'loose-joint-free'},
    conflictsWith: {groupId: 'standing-add-on', optionId},
    message: 'Loose joints require the non-standing configuration.'
  }));
  return {...config, rules: [...config.rules, ...rules]};
}
