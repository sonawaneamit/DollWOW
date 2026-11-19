import { describe, expect, it } from 'vitest';
import namedRegistry from '@/lib/cart/evidence/named-upgrades-release.json';
import readback from './fixtures/dol381-382-admin-readback-2026-11-19.json';
import { releasedNamedBindings } from '@/lib/cart/named-upgrade-release';
import { upgradeBindingAcceptsChoice } from '@/lib/cart/exact-upgrade-lines';
import { getCustomizationConfig } from '@/lib/customization/configs';
import type { Product } from '@/types/product';

// Live Top Fire silicone dolls (options:top-fire-silicone-manual-v1) whose every paid option was checked,
// against live Storefront data on 2026-11-19, to bind 1:1 to the reviewed Top Fire charge family first released for Grace 160F.
const TOP_FIRE_PARENTS: string[] = ["gid://shopify/ProductVariant/54851422388408", "gid://shopify/ProductVariant/54851422355640", "gid://shopify/ProductVariant/54355760119992", "gid://shopify/ProductVariant/54355759169720", "gid://shopify/ProductVariant/54355759268024", "gid://shopify/ProductVariant/54355758579896", "gid://shopify/ProductVariant/54355758055608", "gid://shopify/ProductVariant/54355757826232", "gid://shopify/ProductVariant/54355757236408", "gid://shopify/ProductVariant/54355756351672", "gid://shopify/ProductVariant/54355757138104", "gid://shopify/ProductVariant/54355755860152", "gid://shopify/ProductVariant/54355755106488", "gid://shopify/ProductVariant/54355755040952", "gid://shopify/ProductVariant/54355754483896", "gid://shopify/ProductVariant/54355751796920", "gid://shopify/ProductVariant/54355751731384", "gid://shopify/ProductVariant/54355750355128", "gid://shopify/ProductVariant/54355748683960", "gid://shopify/ProductVariant/54355751141560", "gid://shopify/ProductVariant/54355748225208", "gid://shopify/ProductVariant/54355749863608", "gid://shopify/ProductVariant/54251839291576", "gid://shopify/ProductVariant/54251839127736", "gid://shopify/ProductVariant/54246665748664", "gid://shopify/ProductVariant/54246665715896", "gid://shopify/ProductVariant/54246484607160", "gid://shopify/ProductVariant/54246484574392", "gid://shopify/ProductVariant/54246484508856", "gid://shopify/ProductVariant/54246484443320", "gid://shopify/ProductVariant/54246484410552", "gid://shopify/ProductVariant/54246484312248", "gid://shopify/ProductVariant/54246484213944", "gid://shopify/ProductVariant/54246483525816", "gid://shopify/ProductVariant/54246483329208", "gid://shopify/ProductVariant/54246483427512", "gid://shopify/ProductVariant/54246483296440", "gid://shopify/ProductVariant/54246483230904", "gid://shopify/ProductVariant/54246483198136", "gid://shopify/ProductVariant/54246483099832", "gid://shopify/ProductVariant/54246483067064", "gid://shopify/ProductVariant/54246482280632", "gid://shopify/ProductVariant/54246482182328", "gid://shopify/ProductVariant/54246482215096", "gid://shopify/ProductVariant/54246482116792", "gid://shopify/ProductVariant/54246481821880", "gid://shopify/ProductVariant/54246481789112", "gid://shopify/ProductVariant/54246482051256", "gid://shopify/ProductVariant/54246483001528", "gid://shopify/ProductVariant/54246481756344", "gid://shopify/ProductVariant/54246481035448", "gid://shopify/ProductVariant/54246480969912", "gid://shopify/ProductVariant/54246480904376", "gid://shopify/ProductVariant/54246480871608", "gid://shopify/ProductVariant/54246480806072", "gid://shopify/ProductVariant/54246480707768", "gid://shopify/ProductVariant/54246480740536", "gid://shopify/ProductVariant/54246480642232", "gid://shopify/ProductVariant/54246480609464", "gid://shopify/ProductVariant/54246479888568", "gid://shopify/ProductVariant/54246479823032", "gid://shopify/ProductVariant/54246479790264", "gid://shopify/ProductVariant/54246479757496", "gid://shopify/ProductVariant/54246479691960", "gid://shopify/ProductVariant/54246479659192", "gid://shopify/ProductVariant/54246479593656", "gid://shopify/ProductVariant/54246479626424", "gid://shopify/ProductVariant/54246479528120", "gid://shopify/ProductVariant/54246479200440", "gid://shopify/ProductVariant/54246479134904", "gid://shopify/ProductVariant/54246479069368", "gid://shopify/ProductVariant/54246479036600"];
const GRACE_PARENT_GROUP = 'top-fire-grace-160f-nov6';

describe('Top Fire silicone named checkout charges', () => {
  const parents = namedRegistry.payload.parents as Record<string, string>;
  it('registers every reviewed live Top Fire silicone doll in the Grace charge family', () => {
    expect(TOP_FIRE_PARENTS).toHaveLength(72);
    for (const id of TOP_FIRE_PARENTS) expect(parents[id], id).toBe(GRACE_PARENT_GROUP);
    expect(() => releasedNamedBindings(namedRegistry, TOP_FIRE_PARENTS)).not.toThrow();
  });
  for (const row of readback.filter(item => item.product.tags.includes('options:top-fire-silicone-manual-v1'))) {
    const product = row.product as unknown as Product;
    it(`maps every paid ${product.handle} option to exactly one released charge at the same price`, () => {
      const parent = product.variants[0].id;
      expect(parents[parent]).toBe(GRACE_PARENT_GROUP);
      const bindings = releasedNamedBindings(namedRegistry, [parent]);
      const config = getCustomizationConfig(product);
      const paid = config.groups.flatMap(group => group.options.filter(option => (option.priceDelta ?? 0) > 0).map(option => ({ group: group.label, option })));
      expect(paid.length).toBeGreaterThan(50);
      for (const { group, option } of paid) {
        const matches = bindings.filter(binding => binding.group === group && upgradeBindingAcceptsChoice(binding, option.label) && binding.unitAmount === option.priceDelta);
        expect(matches, `${group}: ${option.label}`).toHaveLength(1);
      }
    });
  }
});
