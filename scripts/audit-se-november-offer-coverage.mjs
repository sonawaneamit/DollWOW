import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const directory = 'data/exports/dol-285-2026-10-29';
const census = JSON.parse(await fs.readFile(`${directory}/admin-census-private.json`, 'utf8'));
const comparison = JSON.parse(await fs.readFile(`${directory}/review-comparison-private.json`, 'utf8'));
const byId = new Map(census.products.map(product => [product.id, product]));
const primaryIds = ['real-skin-texture', 'hard-hands-free', 'implanted-eyebrow-eyelash-free',
  'ultra-soft-vagina-free', 'gel-breasts-free', 'realistic-body-painting-free', 'hyper-realism-body-painting-free',
  'articulated-fingers-free', 'ultra-flex-fingers'];
const rows = comparison.rows.map(row => {
  const product = byId.get(row.id);
  assert(product && product.status === 'ACTIVE', 'Comparison/source identity mismatch');
  const menu = product.customization_groups?.value ?? '[]';
  assert.equal(createHash('sha256').update(menu).digest('hex'), row.menuSha256, 'Stale menu comparison');
  const groups = JSON.parse(menu);
  const extraHead = groups.filter(group => ['an-extra-head', 'an-extra-free-head'].includes(group.id));
  const primary = groups.filter(group => group.id === 'premium-head-body-options-multiple')
    .flatMap(group => group.options.filter(option => primaryIds.includes(option.id)).map(option => ({
      groupId: group.id, id: option.id, label: option.label,
      delta: typeof option.priceDelta === 'number' ? option.priceDelta : null,
      conditional: group.visibleWhen != null
    })));
  return { id: row.id, cohort: row.cohort, bodyCode: row.bodyCode,
    primary,
    extraHead: extraHead.map(group => ({ id: group.id, selectionMode: group.selectionMode,
      zeroChoices: group.options.filter(option => option.priceDelta === 0).length,
      paidChoices: group.options.filter(option => typeof option.priceDelta === 'number' && option.priceDelta > 0).length,
      unknownChoices: group.options.filter(option => typeof option.priceDelta !== 'number').length,
      placeholder: group.options.filter(option => ['other-heads', 'no-add-on', 'no-change'].includes(option.id)).map(option => option.id) })),
    paidOralFunctionsKeptSeparate: groups.filter(group => group.id === 'premium-head-body-options-multiple')
      .flatMap(group => group.options.filter(option => ['oral-heating', 'oral-sucking'].includes(option.id))
        .map(option => ({ id: option.id, delta: option.priceDelta ?? null }))) };
});
const summary = {};
for (const cohort of new Set(rows.map(row => row.cohort))) {
  const parents = rows.filter(row => row.cohort === cohort);
  summary[cohort] = { parents: parents.length,
    primaryChoiceEvidence: Object.fromEntries(primaryIds.map(id => {
      const choices = parents.flatMap(row => row.primary.filter(option => option.id === id));
      return [id, { observed: choices.length, zero: choices.filter(option => option.delta === 0).length,
        paid: choices.filter(option => option.delta > 0).length, unknown: choices.filter(option => option.delta === null).length }];
    })),
    extraHeadGroups: parents.flatMap(row => row.extraHead).length,
    softBellyBodyIdentities: parents.filter(row => ['ST5', 'ST6', 'ST7', 'ST8', 'T148', 'T155', 'T159', 'T165', 'T175'].includes(row.bodyCode)).length };
}
await fs.writeFile(`${directory}/offer-coverage-private.json`, JSON.stringify({ sourceAt: census.at, summary, rows,
  limitations: ['Menu absence does not prove a supplier-included standard feature is absent',
    'Unknown price is not zero even when a label contains FREE',
    'Named heads and placeholders are not random-head entitlements',
    'Realistic oral structure does not include paid oral heating or sucking',
    'Single-selection head groups are evidence of selection shape, not released pricing or head compatibility'],
  shopifyWrites: 0, checkoutReady: false }, null, 2));
console.log(JSON.stringify({ parents: rows.length, menuDigestsVerified: rows.length,
  softBellyExactBodies: rows.filter(row => ['ST5', 'ST6', 'ST7', 'ST8', 'T148', 'T155', 'T159', 'T165', 'T175'].includes(row.bodyCode)).length,
  shopifyWrites: 0, checkoutReady: false }));
