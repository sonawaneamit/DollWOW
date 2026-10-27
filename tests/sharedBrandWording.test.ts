import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { buildSiteStructuredData } from '@/lib/seo/siteStructuredData';
import { buildCollectionMetadata, buildCollectionStructuredData } from '@/lib/catalog/collectionSeo';
import { buildBrandMetadata, buildBrandStructuredData } from '@/lib/catalog/brandSeo';
import { catalogBrands } from '@/lib/catalog/brands';

describe('approved shared brand wording', () => {
  it('uses the approved filter label without changing its data contract', () => {
    const source = fs.readFileSync('components/ProductFilters.tsx', 'utf8');
    expect(source).toContain('label="Doll type" name="productForm" value={filters.productForm} options={catalogFilterOptions.productForms}');
    expect(source).not.toContain('label="Product form"');
  });

  it('uses DollWOW in the root title suffix and shared wordmark', () => {
    expect(fs.readFileSync('app/layout.tsx', 'utf8')).toContain('template: "%s | DollWOW"');
    const header = fs.readFileSync('components/Header.tsx', 'utf8');
    expect(header).toContain('aria-label="DollWOW home"');
    expect(header).toMatch(/>\s+DollWOW\s+<\/span>/);
    expect(header).toContain('src="/images/brand/dollwow-black-gold-lockup.png"');
    expect(fs.readFileSync('components/Footer.tsx', 'utf8')).toContain('alt="DollWOW.com"');
  });

  it('uses the same organization and website name without changing entity IDs', () => {
    const [organization, website] = buildSiteStructuredData();
    expect(organization.name).toBe('DollWOW');
    expect(website.name).toBe('DollWOW');
    expect(organization['@id']).toMatch(/\/#organization$/);
    expect(website.publisher?.['@id']).toBe(organization['@id']);
  });

  it('keeps collection title and canonical semantics while correcting its website name', () => {
    const preset = { title: 'Silicone dolls', filters: { material: 'silicone' } };
    const metadata = buildCollectionMetadata('silicone', preset);
    expect(metadata.title).toContain('Silicone');
    expect(metadata.alternates?.canonical).toMatch(/\/shop\/silicone$/);
    expect(metadata.openGraph).toMatchObject({ siteName: 'DollWOW' });
    expect(buildCollectionStructuredData({ handle: 'silicone', preset, products: [] })[0].isPartOf?.name).toBe('DollWOW');
  });

  it('preserves brand identity and uses DollWOW for the shared website', () => {
    const brand = catalogBrands.find(item => item.value === 'irontech')!;
    const metadata = buildBrandMetadata(brand);
    expect(metadata.alternates?.canonical).toMatch(/\/brands\/irontech-dolls$/);
    expect(metadata.openGraph).toMatchObject({ siteName: 'DollWOW' });
    expect(buildBrandStructuredData(brand, [])[0].isPartOf?.name).toBe('DollWOW');
  });

  it('uses the approved comparison heading', () => {
    const route = fs.readFileSync('app/(store)/shop/[collection]/page.tsx', 'utf8');
    expect(route).toContain('Why compare this collection on DollWOW');
    expect(route).not.toContain('Why compare this collection on DollWow');
  });
});
