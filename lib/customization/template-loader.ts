import 'server-only';
import type { Product } from '@/types/product';
import type { TemplatePresetDefinition } from './template-presets';
import { getCustomizationConfig } from './configs';
import { loadLocalTemplateRecipe } from './template-review-loader';
import { createReleasedTemplateSelector } from './template-release-registry';
import releaseRegistry from './evidence/template-release.json';
import { getPrivateDraftPreview, privateDraftRecipe } from '@/lib/catalog/privateDraftPreview';
import { funwestApprovedPriceBinding } from '@/lib/catalog/funwestApprovedPriceBinding';
import { topfireApprovedPriceBinding } from '@/lib/catalog/topfireApprovedPriceBinding';
import { isZargaReleasedProduct } from '@/lib/catalog/zargaRelease';

const selectReleased = createReleasedTemplateSelector(releaseRegistry);

export async function loadTemplateRecipe(product: Product): Promise<TemplatePresetDefinition | null | undefined> {
  // This approved fixed build has one optional upgrade, not three invented recipes.
  if (isZargaReleasedProduct(product)) return null;
  const privateDraft = await getPrivateDraftPreview(product.handle);
  if (privateDraft && privateDraft.id === product.id) return privateDraftRecipe(product, getCustomizationConfig(product));
  const local = await loadLocalTemplateRecipe(product);
  if (local !== undefined) return local;
  // An environment variable alone cannot promote ignored local review artifacts.
  if (process.env.DOLLWOW_TEMPLATE_RELEASE !== '1') return undefined;
  const config = getCustomizationConfig(product);
  return selectReleased(topfireApprovedPriceBinding(funwestApprovedPriceBinding(product, config), config), config);
}
