import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const packet = JSON.parse(await fs.readFile('/Volumes/Extreme Pro/Projects/DollWOW/data/exports/se-october-packet.json', 'utf8'));
const path = 'data/promotions/se-october-2026-reviewed.json';
const reviewed = JSON.parse(await fs.readFile(path, 'utf8'));
const registry = JSON.parse(await fs.readFile('lib/cart/evidence/named-upgrades-release.json', 'utf8'));
assert.equal(registry.approval.payloadHash, createHash('sha256').update(JSON.stringify(registry.payload)).digest('hex'));
let count = 0;
for (const p of packet.products) {
  const group = p.groups.find(g => g.id === 'premium-head-body-options-multiple');
  const option = group?.options.find(o => o.id === 'movable-eyelids' && o.label === 'Movable Eyelids' && o.priceDelta === 89);
  const head = p.groups.find(g => g.id === 'head-silicone-type');
  if (!option || !head?.options.some(o => o.id === 'ros-free' && o.priceDelta === 0)) continue;
  const bindings = registry.payload.groups[registry.payload.parents[p.parent]];
  if (![89, 62.3].every(amount => bindings?.some(b => !b.readOnly && b.group === group.label && b.label === option.label && b.currencyCode === 'USD' && b.unitAmount === amount))) continue;
  const rows = reviewed.paid[p.handle] ??= [];
  if (!rows.some(row => row.groupId === group.id && row.optionId === option.id)) {
    rows.push({groupId:group.id, groupLabel:group.label, optionId:option.id, label:option.label, catalog:89, promo:62.3});
  }
  count++;
}
assert(count > 0);
await fs.writeFile(path, JSON.stringify(reviewed, null, 2) + '\n');
console.log(JSON.stringify({reviewedEyelidParents:count}));
