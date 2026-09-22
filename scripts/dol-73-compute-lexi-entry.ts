import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { getProductByHandle } from '../lib/shopify/storefront';
import { getCustomizationConfig } from '../lib/customization/configs';
import {
  templateRuntimeHash,
  templateReleasePayloadHash,
  templateReleaseIssues,
  type TemplateReleaseRegistry,
} from '../lib/customization/template-release-registry';
import { templateConfigSignature } from '../lib/customization/template-config-signature';

const HANDLE = 'irontech-lexi-sunset-171cm-s42-ros-max-dark-tanned-silicone-companion-doll';
const TAG = 'options:irontech-female-silicone-head-standard';
const REGISTRY_PATH = path.join(process.cwd(), 'lib/customization/evidence/template-release.json');
const OUT = '/tmp/dol-73-lexi-entry-proposal.json';

async function main() {
  const product = await getProductByHandle(HANDLE, { cache: 'no-store' });
  if (!product) throw new Error(`Product not found: ${HANDLE}`);
  const config = getCustomizationConfig(product);
  const runtimeHash = templateRuntimeHash(product, config);
  const menuSignature = templateConfigSignature(config);
  const menuSha = `sha256:${createHash('sha256').update(menuSignature).digest('hex')}`;

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) as TemplateReleaseRegistry;
  const cohort = registry.payload.entries.filter((e) => e.tag === TAG);
  const candidateKeys = [...new Set(cohort.map((e) => e.bindingKey))];
  let bindingKey: string | null = null;
  const matchReport: Record<string, unknown> = {};
  for (const key of candidateKeys) {
    const recipe = registry.payload.bindings[key];
    if (!recipe) continue;
    const matches = recipe.signature.startsWith('sha256:')
      ? recipe.signature === menuSha
      : recipe.signature === menuSignature;
    matchReport[key] = { matches, tag: recipe.tag, sigPrefix: String(recipe.signature).slice(0, 24) };
    if (matches && recipe.tag === TAG) bindingKey = key;
  }

  const entry = bindingKey
    ? { productId: product.id, handle: product.handle, tag: TAG, bindingKey, runtimeHash }
    : null;

  // Dry-run validation clone (do not write registry)
  let issues: string[] | null = null;
  let payloadHash: string | null = null;
  if (entry) {
    const clone = structuredClone(registry);
    clone.payload.entries.push(entry);
    clone.payload.expectedProductIds.push(entry.productId);
    payloadHash = templateReleasePayloadHash(clone.payload);
    const reviewedAt = new Date().toISOString();
    const evidenceRef = 'docs/dol-73-lexi-cohort-register.json';
    const reviewedBy = 'Store/Codex: DOL-73 Lexi Sunset inherit irontech-female-silicone-head-standard cohort (existing binding; no new recipe)';
    clone.approvals = {
      catalogCompatibility: { reviewedBy, reviewedAt, evidenceRef, payloadHash },
      checkoutChargeLines: { reviewedBy, reviewedAt, evidenceRef, payloadHash },
      coordinatedRelease: { reviewedBy, reviewedAt, evidenceRef, payloadHash },
    };
    issues = templateReleaseIssues(clone);
  }

  const out = {
    ok: Boolean(entry) && issues?.length === 0,
    productId: product.id,
    handle: product.handle,
    tags: product.tags.filter((t) => /^options:/.test(t)),
    stockStatus: product.extended.stockStatus,
    customAvailable: product.extended.customAvailable,
    menuSha,
    matchReport,
    entry,
    payloadHash,
    issues,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
