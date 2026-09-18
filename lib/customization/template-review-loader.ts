import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Product } from '@/types/product';
import type { TemplatePresetDefinition } from './template-presets';

type ReviewPackage = {
  schemaVersion: 1;
  release: 'BLOCKED';
  products: Record<string, string>;
  bindings: Record<string, TemplatePresetDefinition>;
};

export async function loadLocalTemplateRecipe(product: Product): Promise<TemplatePresetDefinition | null | undefined> {
  // This unfinished registry can never be enabled by a production environment variable.
  if (process.env.NODE_ENV === 'production' || process.env.DOLLWOW_TEMPLATE_REVIEW !== '1') return undefined;
  if (/fanreal/i.test(product.vendor ?? '') || /fanreal/i.test(product.handle)) return null;
  const templateTags = product.tags.filter(tag => tag.startsWith('options:'));
  if (templateTags.length !== 1) return null;
  try {
    const file = path.join(process.cwd(), 'data/exports/option-template-review/2026-09-13/buyer-led-recipes/runtime-review-package.json');
    const data: ReviewPackage = JSON.parse(await fs.readFile(file, 'utf8'));
    if (data.schemaVersion !== 1 || data.release !== 'BLOCKED') return null;
    const binding = data.bindings[data.products[product.handle]];
    if (!binding || templateTags[0] !== binding.tag) return null;
    if (typeof binding.signature !== 'string' || !Array.isArray(binding.tiers) || binding.tiers.map(t => t.id).join(',') !== 'starter,enthusiast,collector') return null;
    if (binding.tiers.some(tier => typeof tier.description !== 'string' || [tier.add, tier.remove].some(choices => !Array.isArray(choices) || choices.some(choice => typeof choice.groupId !== 'string' || typeof choice.optionId !== 'string')))) return null;
    return binding;
  } catch {
    return null;
  }
}
