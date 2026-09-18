import 'server-only';
import type { Product } from '@/types/product';
import type { TemplatePresetDefinition } from './template-presets';
import { getCustomizationConfig } from './configs';
import { loadLocalTemplateRecipe } from './template-review-loader';
import { createReleasedTemplateSelector } from './template-release-registry';
import releaseRegistry from './evidence/template-release.json';

const selectReleased = createReleasedTemplateSelector(releaseRegistry);

export async function loadTemplateRecipe(product: Product): Promise<TemplatePresetDefinition | null | undefined> {
  const local = await loadLocalTemplateRecipe(product);
  if (local !== undefined) return local;
  // An environment variable alone cannot promote ignored local review artifacts.
  if (process.env.DOLLWOW_TEMPLATE_RELEASE !== '1') return undefined;
  return selectReleased(product, getCustomizationConfig(product));
}
