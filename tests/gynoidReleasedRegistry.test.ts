import { expect, test, vi } from 'vitest';
import reviewed from '@/data/catalog/gynoid-approved-configurations.json';
import templates from '@/lib/customization/evidence/template-release.json';
import named from '@/lib/cart/evidence/named-upgrades-release.json';
import { gynoidBodyVersionMappings } from '@/lib/catalog/gynoid-body-versions';
import { templateReleaseIssues } from '@/lib/customization/template-release-registry';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
vi.mock('server-only', () => ({}));

test('registers only eleven retained Gynoid products and all thirteen actual variants', () => {
  expect(templateReleaseIssues(templates)).toEqual([]);
  const entries = templates.payload.entries.filter(e => e.bindingKey.startsWith('gynoid-'));
  expect(entries.map(e => e.productId).sort()).toEqual(reviewed.products.map(p => p.productId).sort());
  expect(entries.some(e => /laura|arina|leyla/.test(e.handle))).toBe(false);
  const ids = [...reviewed.products.map(p => p.standardVariantId), ...gynoidBodyVersionMappings.map(p => p.deluxeVariantId)];
  const bindings = releasedNamedBindings(named, ids);
  expect(bindings).toHaveLength(130);
  for (const id of ids) {
    const group = bindings.filter(b => b.parentVariantId === id);
    expect(group.map(b => b.unitAmount).sort((a,b) => a-b)).toEqual([20,25,35,50,100,100,100,150,399,599]);
    expect(group.some(b => /extra head|alternate head/i.test(b.label))).toBe(false);
    expect(group.every(b => b.currencyCode === 'USD')).toBe(true);
  }
});
