import { describe, expect, it } from 'vitest';
import { namedUpgradeBuilds } from '@/lib/cart/named-upgrade-builds';
import type { ExactUpgradeBinding } from '@/lib/cart/exact-upgrade-lines';

const binding: ExactUpgradeBinding = { parentVariantId: 'doll', merchandiseId: 'head',
  productTitle: 'Extra head #134SC', group: 'Extra head', label: '#134SC', unitAmount: 225, currencyCode: 'USD' };
function fixture() {
  const parent = { id: 'parent-a', quantity: 1, merchandise: { id: 'doll', product: { title: 'Lita' } },
    parentRelationship: null, attributes: [
      { key: '_DollWOW_checkout_model', value: 'named-upgrades-v1' },
      { key: 'Included: Skin tone', value: 'Tan' },
      // Deliberately stale data: never authoritative for paid upgrades.
      { key: 'DollWow Add Extra Head', value: '#134SC (+$225)' }
    ] };
  const child = { id: 'head-a', quantity: 1, merchandise: { id: 'head', product: { title: binding.productTitle } },
    parentRelationship: { parent: { id: parent.id } }, attributes: [] };
  return { parent, child, snapshot: { lines: { nodes: [parent, child], pageInfo: { hasNextPage: false } } } };
}
describe('named upgrade cart source of truth', () => {
  it('uses the actual attached merchandise, not saved parent promises', () => {
    const f = fixture();
    expect(namedUpgradeBuilds(f.snapshot, [binding])[0].upgrades[0].title).toBe(binding.productTitle);
    f.snapshot.lines.nodes = [f.parent];
    expect(namedUpgradeBuilds(f.snapshot, [binding])[0]).toMatchObject({
      upgrades: [], includedChoices: [{ key: 'Included: Skin tone', value: 'Tan' }]
    });
  });
  it('does not attach upgrades to another copy of the same doll', () => {
    const f = fixture();
    f.snapshot.lines.nodes.push({ ...f.parent, id: 'parent-b' });
    const builds = namedUpgradeBuilds(f.snapshot, [binding]);
    expect(builds.map(build => build.upgrades.length)).toEqual([1, 0]);
  });
  it('keeps matching quantity two and blocks mismatched edits', () => {
    const f = fixture(); f.parent.quantity = 2;
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('quantities');
    f.child.quantity = 2;
    expect(namedUpgradeBuilds(f.snapshot, [binding])[0].upgrades[0].quantity).toBe(2);
  });
  it('rejects orphan upgrades', () => {
    const f = fixture(); f.snapshot.lines.nodes = [f.child];
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('no doll');
  });
  it('rejects unknown merchandise and duplicate additions', () => {
    const f = fixture();
    f.snapshot.lines.nodes.push({ ...f.child, id: 'head-b' });
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('duplicate');
    f.snapshot.lines.nodes.pop(); f.child.merchandise.id = 'unknown';
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('Unverified');
  });
  it('rejects truncated and unmarked carts', () => {
    const f = fixture(); f.snapshot.lines.pageInfo.hasNextPage = true;
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('Incomplete');
    f.snapshot.lines.pageInfo.hasNextPage = false; f.parent.attributes = [];
    expect(() => namedUpgradeBuilds(f.snapshot, [binding])).toThrow('Unrecognized');
  });
});
