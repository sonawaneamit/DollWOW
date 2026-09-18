import 'server-only';
import { createHash } from 'node:crypto';
import type { Product } from '@/types/product';
import type { BrandCustomizationConfig } from '@/types/customization';
import type { TemplatePresetDefinition } from './template-presets';
import { templateConfigSignature } from './template-config-signature';
import { getDefaultSelections } from './resolve';

type ReleaseEntry = {
  productId: string;
  handle: string;
  tag: string;
  bindingKey: string;
  runtimeHash: string;
};
type Approval = { reviewedBy: string; reviewedAt: string; evidenceRef: string; payloadHash: string };
export type TemplateReleaseRegistry = {
  schemaVersion: 2;
  releaseStatus: 'BLOCKED' | 'APPROVED';
  payload: {
    releaseId: string;
    sourceSnapshotHash: string;
    expectedProductIds: string[];
    entries: ReleaseEntry[];
    bindings: Record<string, TemplatePresetDefinition>;
  };
  approvals: Record<'catalogCompatibility' | 'checkoutChargeLines' | 'coordinatedRelease', Approval> | null;
};

const hashPattern = /^[a-f0-9]{64}$/;
const productIdPattern = /^gid:\/\/shopify\/Product\/\d+$/;
const tagPattern = /^options:[a-z0-9]+(?:-[a-z0-9]+)+$/;
const nonPlaceholder = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 &&
  !/(?:<[^>]+>|\b(?:tbd|todo|placeholder|pending)\b)/i.test(value);

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])
  );
  return value;
}
function digest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
export function templateReleasePayloadHash(payload: TemplateReleaseRegistry['payload']) {
  return digest(payload);
}

/** Bind the actual product and effective menu, not just its reusable options: tag. */
export function templateRuntimeHash(product: Product, config: BrandCustomizationConfig) {
  const { catalogIdentityKey, catalogBodyIdentityKey, brand, bodyType, material, heightCm, cupSize, bodyCode,
    headModel, stockStatus, customAvailable, irontechUlwEligibility } = product.extended;
  return digest({
    id: product.id, handle: product.handle, vendor: product.vendor, productType: product.productType,
    // Non-template tags can affect brand fallbacks, eligibility and promotions.
    tags: [...product.tags].sort(),
    identity: { catalogIdentityKey, catalogBodyIdentityKey, brand, bodyType, material, heightCm, cupSize, bodyCode,
      headModel, stockStatus, customAvailable, irontechUlwEligibility },
    variants: product.variants,
    priceRange: product.priceRange,
    configId: config.id,
    menuSignature: templateConfigSignature(config),
    defaults: getDefaultSelections(config),
    // Legacy availability and promotion logic still reads supplier labels/notes.
    labels: config.groups.map(group => ({ id: group.id, label: group.label, sourceLabel: group.sourceLabel,
      options: group.options.map(option => ({ id: option.id, label: option.label, sourceLabel: option.sourceLabel,
        priceLabel: option.priceLabel, productionNote: option.productionNote })) }))
  });
}

function isRecipe(value: unknown): value is TemplatePresetDefinition {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as TemplatePresetDefinition;
  if (!tagPattern.test(recipe.tag) || /fanreal/i.test(recipe.tag) || typeof recipe.signature !== 'string' || !recipe.signature.length ||
    !Array.isArray(recipe.tiers) || recipe.tiers.map(tier => tier?.id).join(',') !== 'starter,enthusiast,collector') return false;
  return recipe.tiers.every(tier => nonPlaceholder(tier.description) && [tier.add, tier.remove].every(choices =>
    Array.isArray(choices) && choices.every(choice => choice && nonPlaceholder(choice.groupId) && nonPlaceholder(choice.optionId))));
}

/** Structural/evidence binding only. Referenced reviews must be performed before approval. */
export function templateReleaseIssues(input: unknown): string[] {
  try {
    if (!input || typeof input !== 'object') return ['invalid_registry'];
    const registry = input as TemplateReleaseRegistry;
    if (registry.schemaVersion !== 2 || registry.releaseStatus !== 'APPROVED') return ['release_not_approved'];
    const payload = registry.payload;
    if (!payload || !nonPlaceholder(payload.releaseId) || !hashPattern.test(payload.sourceSnapshotHash) ||
      !Array.isArray(payload.expectedProductIds) || !payload.expectedProductIds.length ||
      !Array.isArray(payload.entries) || !payload.entries.length || !payload.bindings || typeof payload.bindings !== 'object' || Array.isArray(payload.bindings)) return ['invalid_payload'];
    const ids = payload.expectedProductIds;
    if (ids.some(id => typeof id !== 'string' || !productIdPattern.test(id)) || new Set(ids).size !== ids.length) return ['invalid_scope'];
    const expectedIds = new Set(ids);
    const entries = payload.entries;
    if (entries.some(entry => !entry || typeof entry.productId !== 'string' || !productIdPattern.test(entry.productId) ||
      !nonPlaceholder(entry.handle) || !tagPattern.test(entry.tag) || /fanreal/i.test(`${entry.handle} ${entry.tag}`) ||
      !nonPlaceholder(entry.bindingKey) || !hashPattern.test(entry.runtimeHash))) return ['invalid_entry'];
    if (entries.length !== ids.length || new Set(entries.map(entry => entry.productId)).size !== entries.length ||
      new Set(entries.map(entry => entry.handle)).size !== entries.length || entries.some(entry => !expectedIds.has(entry.productId))) return ['incomplete_or_duplicate_scope'];
    const bindingKeys = Object.keys(payload.bindings);
    if (bindingKeys.length !== new Set(entries.map(entry => entry.bindingKey)).size ||
      bindingKeys.some(key => !isRecipe(payload.bindings[key])) || entries.some(entry =>
        !Object.hasOwn(payload.bindings, entry.bindingKey) || payload.bindings[entry.bindingKey].tag !== entry.tag)) return ['invalid_bindings'];
    const payloadHash = templateReleasePayloadHash(payload);
    for (const gate of ['catalogCompatibility', 'checkoutChargeLines', 'coordinatedRelease'] as const) {
      const approval = registry.approvals?.[gate];
      if (!approval || !nonPlaceholder(approval.reviewedBy) || !nonPlaceholder(approval.evidenceRef) ||
        !nonPlaceholder(approval.reviewedAt) || !Number.isFinite(Date.parse(approval.reviewedAt)) || approval.payloadHash !== payloadHash) return [`missing_or_stale_${gate}`];
    }
    return [];
  } catch {
    return ['malformed_registry'];
  }
}

export function selectReleasedTemplateRecipe(registry: TemplateReleaseRegistry, product: Product,
  config: BrandCustomizationConfig): TemplatePresetDefinition | null {
  return createReleasedTemplateSelector(registry)(product, config);
}

export function createReleasedTemplateSelector(input: unknown) {
  // Copy once: callers cannot change a validated registry behind the selector.
  const registry = structuredClone(input) as TemplateReleaseRegistry;
  const approved = templateReleaseIssues(registry).length === 0;
  const entries = new Map(approved ? registry.payload.entries.map(entry => [entry.productId, entry]) : []);
  return (product: Product, config: BrandCustomizationConfig): TemplatePresetDefinition | null => {
    if (!approved || /fanreal/i.test(`${product.vendor} ${product.extended.brand} ${product.handle}`)) return null;
    if (product.extended.stockStatus !== 'custom' && product.extended.customAvailable !== true) return null;
    const tags = product.tags.filter(tag => /^options:/i.test(tag));
    if (tags.length !== 1) return null;
    const entry = entries.get(product.id);
    if (!entry || entry.handle !== product.handle || entry.tag !== tags[0] || entry.runtimeHash !== templateRuntimeHash(product, config)) return null;
    const recipe = registry.payload.bindings[entry.bindingKey];
    const signature = templateConfigSignature(config);
    const matches = recipe.signature.startsWith('sha256:')
      ? recipe.signature === `sha256:${createHash('sha256').update(signature).digest('hex')}`
      : recipe.signature === signature;
    return matches ? { ...structuredClone(recipe), signature } : null;
  };
}
