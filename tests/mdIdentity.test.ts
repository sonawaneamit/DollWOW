import {describe, expect, it} from 'vitest';
import {brandHubHref, catalogBrands} from '@/lib/catalog/brands';
import {catalogFilterOptions} from '@/lib/catalog/filters';
import {brandSeoProfile, buildBrandStructuredData} from '@/lib/catalog/brandSeo';

describe('MD factual identity', () => {
  it('maps recorded manufacturer aliases to one route and filter', () => {
    for (const name of ['MD Doll', 'MD Dolls', 'MDDOLL', 'md']) {
      expect(brandHubHref(name)).toBe('/brands/md-dolls');
    }
    expect(catalogFilterOptions.brands.filter(brand => brand.value === 'md')).toHaveLength(1);
  });

  it('does not conflate other manufacturer names', () => {
    expect(brandHubHref('WM Doll')).not.toBe('/brands/md-dolls');
    expect(brandHubHref('My Robot Doll')).not.toBe('/brands/md-dolls');
  });

  it('keeps factual scope and visible FAQ schema aligned', () => {
    const brand = catalogBrands.find(brand => brand.value === 'md')!;
    const profile = brandSeoProfile(brand);
    expect(profile.intro).toContain('161 to 168 cm');
    const copy = JSON.stringify(profile);
    for (const feature of ['EVO skeleton', 'jelly breasts', 'articulated or wire fingers', '161 cm body', '166D', 'if the selected head supports it'])
      expect(copy).toContain(feature);
    expect(copy).not.toMatch(/model records|recorded body|does not establish|every MD head includes ROS/i);
    expect(JSON.stringify(profile)).not.toMatch(/hypoallergenic|medical-grade|authorized dealer|net weight/i);
    const faq = buildBrandStructuredData(brand, []).find(item => item['@type'] === 'FAQPage');
    expect(faq?.mainEntity).toEqual(profile.faqs.map(item => ({
      '@type': 'Question', name: item.question,
      acceptedAnswer: {'@type': 'Answer', text: item.answer}
    })));
  });
});
