import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const evidence = process.env.DOLLWOW_CATALOG_EVIDENCE_DIR ?? fileURLToPath(new URL('../data/exports/catalog-ops-five-2026-10-02', import.meta.url));
const parentProductId = 'gid://shopify/Product/10630580273336';
const parentVariantId = 'gid://shopify/ProductVariant/54234105675960';
export const SUKI_CHARGE_TAGS = ['dollwow-system', 'custom-option-charge', 'exact-upgrade-pilot'];
const details = {
  'ultra-light-weight': ['Ultra Light Weight body option', 'The Ultra Light Weight body option offered for the 166cm 2.0 S20 ROS MAX Suki configuration by the exact ITD911 retailer menu. This line records that selected option; no finished weight, reduction percentage or combined-performance result is promised.'],
  'soft-vagina': ['Soft Vagina option', 'The Soft Vagina configuration option selected for the associated Irontech Suki doll. This is a body configuration charge, distinct from a removable insert accessory.'],
  'soft-thigh': ['Soft Thigh option', 'The Soft Thigh configuration option selected for the associated Irontech Suki doll. This line records that body option separately from the base doll.'],
  'soft-belly': ['Soft Belly option', 'The Soft Belly configuration option selected for the associated Irontech Suki doll. This line records that body option separately from the base doll.'],
  'electric-butt': ['Electric Butt option', 'The Electric Butt configuration option listed in the exact Irontech Suki source menu. This line does not represent the separate Auto Blowjob or Auto Vagina Clamping and Sucking options.'],
  'wm-cleaning-set': ['WM Cleaning Set', 'The WM Cleaning Set accessory selected from the Irontech Suki menu. This is the named cleaning-set option, not the Premium Cleaning Set, Care Kit or Deluxe Care Kit. Individual kit contents are not specified in the reviewed source.'],
  'teeth-inserts-normal': ['Teeth inserts - normal', 'The normal teeth-insert accessory selected from the Irontech Suki menu. This is distinct from the vampire teeth-insert option.'],
  'teeth-inserts-vampire': ['Teeth inserts - vampire', 'The vampire teeth-insert accessory selected from the Irontech Suki menu. This is distinct from the normal teeth-insert option.'],
  'tpe-penis-15cm': ['TPE penis accessory - 15cm', 'The 15cm TPE penis accessory listed in the Irontech Suki menu. This line records the specified TPE material and 15cm size, not the 19cm TPE or silicone alternatives.'],
  'tpe-penis-19cm': ['TPE penis accessory - 19cm', 'The 19cm TPE penis accessory listed in the Irontech Suki menu. This line records the specified TPE material and 19cm size, not the 15cm TPE or silicone alternatives.'],
  'silicone-penis-15cm': ['Silicone penis accessory - 15cm', 'The 15cm silicone penis accessory listed in the Irontech Suki menu. This line records the specified silicone material and 15cm size, not the 25cm silicone or TPE alternatives.'],
  'silicone-penis-25cm': ['Silicone penis accessory - 25cm', 'The 25cm silicone penis accessory listed in the Irontech Suki menu. This line records the specified silicone material and 25cm size, not the 15cm silicone or TPE alternatives.'],
  'vagina-insert': ['Vagina insert accessory', 'The Vagina Insert accessory listed in the Irontech Suki menu. This is an insert accessory, distinct from the Soft Vagina body configuration option.'],
  'nipple-piercing': ['Nipple piercing option', 'The Nipple Piercing option selected from the Irontech Suki accessories menu. Jewelry material, dimensions and quantity are not specified in the reviewed source.'],
  'belly-piercing': ['Belly piercing option', 'The Belly Piercing option selected from the Irontech Suki accessories menu. This is distinct from the nipple-piercing option; jewelry material and dimensions are not specified in the reviewed source.'],
  'silicone-socks': ['Silicone socks', 'The Silicone Socks accessory selected from the Irontech Suki menu. The source specifies the accessory name but not dimensions or a load-support rating.'],
  'head-standing': ['Head stand accessory', 'The accessory labeled Head Standing in the Irontech Suki source menu. This line records the selected head-stand accessory, not an additional head or the standing-feet body option.'],
  'hooks': ['Hooks accessory', 'The Hooks accessory selected from the Irontech Suki menu. The reviewed source does not specify the hook count, material or load rating.'],
  'storage-case': ['Storage case', 'The Storage Case accessory selected from the Irontech Suki menu. This is the source-listed storage case, not either weight-tier flight-case option; dimensions and contents are not specified in the reviewed source.']
};
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export function buildSukiChargeSpecs(packet) {
  assert.equal(packet.productId, parentProductId);
  assert.equal(packet.variantId, parentVariantId);
  assert.equal(packet.chargeMappings.reused.length, 8);
  const specs = [];
  const hair = packet.chargeMappings.missing.filter(c => c.groupId === 'pubic-hair');
  assert.equal(hair.length, 8);
  assert(hair.every(c => c.unitAmount === 30));
  for (const choice of packet.chargeMappings.missing) {
    const g = packet.config.groups.find(g => g.id === choice.groupId);
    const o = g?.options.find(o => o.id === choice.optionId);
    assert(o && o.purchasable !== false && o.displayable !== false && o.priceVerified === true);
    assert.equal(o.priceDelta, choice.unitAmount);
    if (choice.groupId === 'pubic-hair' && choice !== hair[0]) continue;
    const [title, description] = choice.groupId === 'pubic-hair'
      ? ['Pubic hair style', 'Optional pubic hair style selected for the associated Irontech Suki doll. The customer-selected style is recorded in the Customization line-item details. This is one style family, not a general-purpose charge for unrelated options.']
      : details[choice.optionId] ?? [];
    assert(title && description, `Missing individual description for ${choice.optionId}`);
    const members = choice.groupId === 'pubic-hair' ? hair : [choice];
    const productTitle = `Irontech Dolls - ${title}`;
    const key = crypto.createHash('sha256').update(JSON.stringify([choice.group, productTitle, choice.unitAmount])).digest('hex').slice(0, 16);
    specs.push({ group: choice.group, label: title, unitAmount: choice.unitAmount,
      choiceLabels: members.map(c => c.label), choices: members.map(c => ({ groupId: c.groupId, optionId: c.optionId })),
      productTitle, descriptionHtml: `<p>${escape(description)}</p><p>Ordered with the associated doll and fulfilled with that order. This line is not a complete doll or a delivery charge.</p>`,
      handle: `dollwow-upgrade-irontech-${key}`, currencyCode: 'USD',
      tags: [...SUKI_CHARGE_TAGS, 'catalog-review-hold', 'suki-menu-review-2026-10-02'] });
  }
  assert.equal(specs.length, 20);
  assert.equal(new Set(specs.map(s => s.handle)).size, specs.length);
  return specs;
}

async function main() {
  const packet = JSON.parse(await fs.readFile(`${evidence}/suki-prepared-menu.json`, 'utf8'));
  const { payloadSha256, ...payload } = packet;
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'), payloadSha256);
  const specs = buildSukiChargeSpecs(packet);
  const verifyOnly = process.argv.includes('--verify-only');
  const repairTags = process.argv.includes('--repair-pilot-tags');
  assert(!(verifyOnly && repairTags), 'Choose read-only verification or tag repair, not both.');
  const execute = process.argv.includes('--execute') || verifyOnly || repairTags;
  const candidate = repairTags ? JSON.parse(await fs.readFile(`${evidence}/suki-named-charge-candidate.json`, 'utf8')) : null;
  const report = { parentProductId, parentVariantId, sourceRevision: packet.sourceRevision, preparedMenuSha256: payloadSha256,
    status: execute ? 'IN_PROGRESS_DRAFT_ONLY' : 'DRY_RUN', created: [], deduplicated: [], reused: [], bindings: [],
    specs, exclusions: packet.chargeMappings.exclusions, parentWrites: 0, publications: 0, tagRepairs: [],
    runtimeMenuSha256: crypto.createHash('sha256').update(JSON.stringify(packet.config)).digest('hex') };
  const save = () => fs.writeFile(`${evidence}/${repairTags ? 'suki-charge-tag-repair.json' : verifyOnly ? 'suki-charge-readback.json' : 'suki-named-charge-candidate.json'}`, JSON.stringify(report, null, 2) + '\n');
  if (!execute) {
    await fs.writeFile(`${evidence}/suki-named-charge-plan.json`, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, draftProducts: specs.length, coveredChoices: 27 }));
    return;
  }
  const { api } = await import(pathToFileURL(path.resolve(evidence, '../discount-review.mjs')).href);
  const fields = 'id title handle status descriptionHtml tags variants(first:2){nodes{id price taxable inventoryPolicy inventoryItem{requiresShipping tracked}}}';
  const validate = (p, spec, requirePilotTag = true) => {
    assert.equal(p.status, 'DRAFT');
    assert.equal(p.handle, spec.handle);
    assert.equal(p.title, spec.productTitle);
    const normalizedHtml = html => html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    assert.equal(normalizedHtml(p.descriptionHtml), normalizedHtml(spec.descriptionHtml));
    assert(p.tags.includes('dollwow-system') && p.tags.includes('custom-option-charge'));
    if (requirePilotTag) assert(p.tags.includes('exact-upgrade-pilot'), 'Missing mandatory exact-upgrade-pilot tag');
    assert.equal(p.variants.nodes.length, 1);
    const v = p.variants.nodes[0];
    assert.equal(Number(v.price), spec.unitAmount);
    assert.equal(v.taxable, true);
    assert.equal(v.inventoryPolicy, 'CONTINUE');
    assert.equal(v.inventoryItem.requiresShipping, false);
    assert.equal(v.inventoryItem.tracked, false);
    return v;
  };
  try {
    const shop = await api('query{shop{currencyCode}}');
    assert.equal(shop.shop.currencyCode, 'USD');
    // Existing semantic matches are read-only, including their descriptions and prices.
    const existing = await api(`query($ids:[ID!]!){nodes(ids:$ids){... on ProductVariant{id price inventoryItem{requiresShipping} product{id title handle status descriptionHtml tags}}}}`,
      { ids: packet.chargeMappings.reused.map(c => c.binding.merchandiseId) });
    for (const item of packet.chargeMappings.reused) {
      const b = item.binding, v = existing.nodes.find(v => v?.id === b.merchandiseId);
      assert(v); assert.equal(Number(v.price), b.unitAmount); assert.equal(v.inventoryItem.requiresShipping, false);
      assert.equal(v.product.title, b.productTitle);
      assert(v.product.tags.includes('dollwow-system') && v.product.tags.includes('exact-upgrade-pilot'), `Reused charge lacks pilot tags: ${b.merchandiseId}`);
      report.reused.push({ ...item, readback: v, action: 'READ_ONLY_REUSED' });
      report.bindings.push({ ...b, status: v.product.status, origin: 'EXISTING_SEMANTIC_MATCH' });
    }
    // Preflight every deterministic handle before any creation. Existing items are never updated.
    const found = new Map();
    for (const spec of specs) {
      const result = await api(`query($q:String!){products(first:10,query:$q){nodes{${fields}}}}`, { q: `handle:${spec.handle}` });
      const matches = result.products.nodes.filter(p => p.handle === spec.handle);
      assert(matches.length <= 1);
      if (matches[0]) {
        validate(matches[0], spec, !repairTags);
        if (repairTags) assert(candidate.bindings.some(b => b.origin !== 'EXISTING_SEMANTIC_MATCH' && b.status === 'DRAFT' && b.productId === matches[0].id && b.handle === spec.handle), 'Tag repair is limited to the recorded Suki charge drafts.');
        found.set(spec.handle, matches[0]);
      }
    }
    if (verifyOnly || repairTags) assert.equal(found.size, specs.length, 'Audit/tag repair cannot create missing drafts.');
    await save();
    for (const spec of specs) {
      let product = found.get(spec.handle);
      if (product) {
        report.deduplicated.push(product.id);
        if (repairTags && !product.tags.includes('exact-upgrade-pilot')) {
          const tagged = await api('mutation($id:ID!,$tags:[String!]!){tagsAdd(id:$id,tags:$tags){userErrors{message}}}',
            { id: product.id, tags: ['exact-upgrade-pilot'] });
          assert.deepEqual(tagged.tagsAdd.userErrors, []);
          report.tagRepairs.push({ productId: product.id, added: ['exact-upgrade-pilot'], beforeTags: product.tags });
          await save();
        }
      }
      else {
        assert(!verifyOnly && !repairTags, 'Audit/tag repair cannot create products.');
        const result = await api(`mutation($p:ProductCreateInput!){productCreate(product:$p){product{id status variants(first:1){nodes{id}}}userErrors{message}}}`,
          { p: { title: spec.productTitle, handle: spec.handle, descriptionHtml: spec.descriptionHtml, vendor: 'DollWOW',
            productType: 'System charge', status: 'DRAFT', tags: spec.tags,
            metafields: [{ namespace: 'custom', key: 'source_url', type: 'single_line_text_field', value: 'https://www.yourdoll.com/product/sex-doll-itd911/' }] } });
        assert.deepEqual(result.productCreate.userErrors, []);
        product = result.productCreate.product;
        assert.equal(product.status, 'DRAFT');
        report.created.push({ productId: product.id, handle: spec.handle, stage: 'CREATED_WITH_DESCRIPTION' });
        await save();
        const updated = await api(`mutation($id:ID!,$v:[ProductVariantsBulkInput!]!){productVariantsBulkUpdate(productId:$id,variants:$v){userErrors{message}}}`,
          { id: product.id, v: [{ id: product.variants.nodes[0].id, price: String(spec.unitAmount), taxable: true,
            inventoryPolicy: 'CONTINUE', inventoryItem: { requiresShipping: false, tracked: false } }] });
        assert.deepEqual(updated.productVariantsBulkUpdate.userErrors, []);
      }
      const readback = (await api(`query($id:ID!){product(id:$id){${fields}}}`, { id: product.id })).product;
      const variant = validate(readback, spec);
      if (repairTags) {
        const { tags: beforeTags, ...before } = found.get(spec.handle);
        const { tags: afterTags, ...after } = readback;
        assert.deepEqual(after, before, 'Tag repair changed a non-tag field.');
        assert(beforeTags.every(tag => afterTags.includes(tag)), 'Tag repair removed an existing tag.');
      }
      const created = report.created.find(p => p.productId === readback.id);
      if (created) created.stage = 'READBACK_VERIFIED_DRAFT';
      report.bindings.push({ parentVariantId, ...spec, productId: readback.id, merchandiseId: variant.id,
        status: 'DRAFT', origin: found.has(spec.handle) ? 'DEDUPLICATED_DRAFT' : 'NEW_DRAFT', readback });
      await save();
    }
    report.status = repairTags ? 'PASS_PILOT_TAG_REPAIR_DRAFT_ONLY' : verifyOnly ? 'PASS_READ_ONLY_DEDUP_AND_DRAFT_READBACK' : 'PASS_DRAFTS_ONLY_NOT_ACTIVATED';
    report.sourceRevision = JSON.parse(await fs.readFile(`${evidence}/suki_glow-draft-input.json`, 'utf8')).revision;
    report.completedAt = new Date().toISOString();
    report.parentReadback = (await api('query($id:ID!){product(id:$id){id status updatedAt}}', { id: parentProductId })).product;
    await save();
    if (repairTags) {
      for (const binding of candidate.bindings.filter(b => b.origin !== 'EXISTING_SEMANTIC_MATCH')) {
        binding.readback = report.bindings.find(b => b.productId === binding.productId).readback;
        binding.tags = binding.readback.tags;
      }
      candidate.reused = report.reused;
      candidate.pilotTagVerification = { status: 'PASS', verifiedBindings: report.bindings.length, updatedDrafts: report.tagRepairs.length,
        evidence: 'suki-charge-tag-repair.json', verifiedAt: report.completedAt };
      await fs.writeFile(`${evidence}/suki-named-charge-candidate.json`, JSON.stringify(candidate, null, 2) + '\n');
    }
    console.log(JSON.stringify({ status: report.status, created: report.created.length, deduplicated: report.deduplicated.length,
      reused: report.reused.length, candidateBindings: report.bindings.length, tagRepairs: report.tagRepairs.length, parentWrites: 0, publications: 0 }));
  } catch (error) {
    report.status = 'FAILED_STOPPED_NO_EXISTING_ITEM_REPAIR';
    report.error = error instanceof Error ? error.message : String(error);
    await save();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
