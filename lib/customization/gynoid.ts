import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig, CustomizationRule } from '@/types/customization';
import type { TemplatePresetDefinition } from './template-presets';
import { templateConfigSignature } from './template-config-signature';
import { gynoidBodyVersionMapping } from '@/lib/catalog/gynoid-body-versions';

export function reviewedGynoidIdentity(product: Pick<Product, 'id' | 'handle'>) {
  return reviewed.products.find(row => row.productId === product.id && row.handle === product.handle);
}

export function assertGynoidStandardCheckout(product: Product, variantId: string) {
  const row = reviewedGynoidIdentity(product);
  if (!row || gynoidBodyVersionMapping(product)) return;
  const variant = product.variants.find(v => v.id === variantId);
  if (variantId !== row.standardVariantId || !variant || variant.price.currencyCode !== 'USD' ||
      Number(variant.price.amount) !== row.standardUSD) {
    throw new Error('The approved Gynoid Standard price or identity needs review.');
  }
}

/** Exact retained menus own their graph, including single fixed and conditional groups. */
export function getGynoidCustomizationConfig(product: Product): BrandCustomizationConfig | null {
  const row = reviewedGynoidIdentity(product);
  if (!row) return null;
  const source = product.extended.customizationGroups;
  const tags = product.tags.filter(tag => /^options:/i.test(tag));
  const expectedGroups = ['head', 'head-type', 'skin-tone', 'hairstyle', 'eye-color', 'vagina', 'vagina-hair-type',
    'vagina-texture', 'vagina-depth', 'joint', 'standing-add-on', 'premium-head-body-options-multiple',
    'implanted-hair-color', 'accessories', ...(row.tag === 'options:gynoid-body-21-mvp-v1' ? ['body-version'] : [])];
  if (product.extended.headModel !== row.headModel || !source?.length || tags.length !== 1 || tags[0] !== row.tag ||
      source.length !== expectedGroups.length || source.some(group => !expectedGroups.includes(group.id)) ||
      new Set(source.map(group => group.id)).size !== source.length ||
      source.some(group => !group.id || !group.label || !group.options?.length ||
        new Set(group.options.map(option => option.id)).size !== group.options.length ||
        group.options.some(option => !option.id || !option.label))) {
    throw new Error('This Gynoid configuration needs review before checkout.');
  }
  if (source.some(group => group.visibleWhen?.some(branch => !branch.length || branch.some(ref =>
    !source.some(parent => parent.id === ref.groupId && parent.options.some(option => option.id === ref.optionId)))))) {
    throw new Error('The Gynoid customization dependencies need review before checkout.');
  }
  const groups = structuredClone(source);
  const head = groups.find(group => group.id === 'head');
  if (!head?.options.some(option => option.id === 'no-change' && option.priceDelta === 0 && option.priceVerified === true)) {
    throw new Error('The photographed Gynoid head needs review before checkout.');
  }
  // A saved zero price is not evidence that another head is included.
  for (const option of head.options) {
    if (option.id === 'no-change') continue;
    option.priceDelta = undefined;
    option.priceVerified = false;
    option.purchasable = false;
    option.productionNote = 'Alternate-head inclusion and incremental price await factory confirmation.';
  }
  // This fixed supplier field identifies Model 21, not Standard versus Deluxe.
  const model = groups.find(group => group.id === 'body-version');
  if (model?.options.length === 1 && model.options[0].id === 'model-21') model.label = 'Body model';
  return {
    id: `gynoid-approved-${row.productId.split('/').at(-1)}`,
    brandLabel: 'Gynoid',
    leadTimeNote: 'Your selected configuration is reviewed before production.',
    groups,
    rules: structuredClone(reviewed.rules[row.ruleSet as keyof typeof reviewed.rules]) as CustomizationRule[]
  };
}

/** Candidate only: production selection still requires the signed template registry. */
export function prepareGynoidTemplateCandidate(product: Product, config: BrandCustomizationConfig): TemplatePresetDefinition | null {
  const row = reviewedGynoidIdentity(product);
  if (!row || config.id !== `gynoid-approved-${row.productId.split('/').at(-1)}`) return null;
  const tiers = structuredClone(reviewed.tiers) as TemplatePresetDefinition['tiers'];
  tiers[0].description = 'Selected body construction with hard standing feet.';
  return { tag: row.tag, signature: templateConfigSignature(config), tiers };
}
