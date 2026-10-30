import type {Product} from '@/types/product';
import type {BrandCustomizationConfig, CustomizationRule} from '@/types/customization';

const reviewed: Record<string,string> = {
  'firefly-mary-160cm-max-silicone-companion-doll':'gid://shopify/Product/10639456305336',
  'firefly-mary-164cm-normal-silicone-companion-doll':'gid://shopify/Product/10639456960696',
  'firefly-mary-165cm-max-silicone-companion-doll':'gid://shopify/Product/10639457059000',
  'firefly-mary-164cm-max-silicone-companion-doll':'gid://shopify/Product/10639457124536'
};

export function isReviewedFireflyProduct(product: Pick<Product,'id'|'handle'>) {
  return reviewed[product.handle]===product.id;
}

export function withFireflyReleaseRules(product: Product, config: BrandCustomizationConfig): BrandCustomizationConfig {
  if(!isReviewedFireflyProduct(product))return config;
  // Exact historical supplier rule, previously verified in the approved private preview.
  const rules: CustomizationRule[]=['standing-free','standing-without-bolts-orig-120-free'].map(optionId=>({
    id:`firefly-loose-${optionId}`,type:'incompatible',
    when:{groupId:'premium-body-options-multiple',optionId:'loose-joint-free'},
    conflictsWith:{groupId:'standing-add-on',optionId},
    message:'Loose joints require the non-standing configuration.'
  }));
  return {...config,rules:[...config.rules,...rules]};
}
