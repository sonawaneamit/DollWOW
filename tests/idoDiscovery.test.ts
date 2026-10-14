import {describe, expect, it} from 'vitest';
import {brandHubHref, catalogBrands} from '@/lib/catalog/brands';
import {catalogFilterOptions} from '@/lib/catalog/filters';
import {brandSeoProfile, buildBrandMetadata, buildBrandStructuredData} from '@/lib/catalog/brandSeo';

describe('IDO brand discovery', () => {
  it('consolidates manufacturer aliases in navigation and filters', () => {
    for (const name of ['IDO', 'IDO Doll', 'IDO Dolls', 'IDODOLL', 'idodolls'])
      expect(brandHubHref(name)).toBe('/brands/ido-dolls');
    expect(catalogFilterOptions.brands.some(x => x.value === 'ido')).toBe(true);
  });
  it('explains factory inclusions while keeping head and weight exceptions precise', () => {
    const brand = catalogBrands.find(x => x.value === 'ido')!;
    const profile = brandSeoProfile(brand);
    expect(buildBrandMetadata(brand).alternates?.canonical).toContain('/brands/ido-dolls');
    expect(profile.intro).toContain('ID-series code');
    expect(profile.faqs).toHaveLength(6);
    const copy = JSON.stringify(profile);
    for (const feature of ['weight reduction 4.0', 'EVO skeleton', 'capillary body makeup', 'wired toes', 'ID1H', 'no separate option charge'])
      expect(copy).toContain(feature);
    expect(copy).not.toMatch(/paid upgrades are separate|all heads include ROS|all premium features/i);
    expect(JSON.stringify(profile)).not.toMatch(/supplier confirmation|WIP|authorized dealer|all upgrades included|AI-powered/i);
    const faq = buildBrandStructuredData(brand, []).find(x => x['@type'] === 'FAQPage');
    expect(faq?.mainEntity).toEqual(profile.faqs.map(x => ({'@type': 'Question', name: x.question, acceptedAnswer: {'@type': 'Answer', text: x.answer}})));
  });
});
