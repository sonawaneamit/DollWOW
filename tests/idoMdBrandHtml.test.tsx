import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parse } from 'node-html-parser';
import { describe, expect, it, vi } from 'vitest';
import { getCatalogBrand } from '@/lib/catalog/brands';
import { brandSeoProfile } from '@/lib/catalog/brandSeo';

vi.mock('@/lib/shopify/storefront', () => ({ getProducts: vi.fn(async () => []) }));
vi.mock('@/lib/utils/env', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils/env')>();
  return { ...actual, env: { ...actual.env, NEXT_PUBLIC_SITE_URL: 'https://dollwow.com' } };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), notFound: () => { throw new Error('Not found'); } }));
import BrandHubPage, { generateMetadata } from '@/app/brands/[brand]/page';

describe('IDO/MD factual answers in server-rendered brand HTML', () => {
  it.each(['ido', 'md'])('%s renders the reviewed profile and identical FAQ schema at its canonical route', async value => {
    const brand = getCatalogBrand(value)!;
    const params = Promise.resolve({ brand: brand.collectionHandle });
    const metadata = await generateMetadata({ params });
    expect(metadata.alternates?.canonical).toBe(`https://dollwow.com/brands/${value}-dolls`);
    const html = renderToStaticMarkup(await BrandHubPage({ params, searchParams: Promise.resolve({}) }));
    const document = parse(html);
    const schemas = document.querySelectorAll('script[type="application/ld+json"]').map(script => JSON.parse(script.textContent));
    const profile = brandSeoProfile(brand);
    expect(document.querySelector('h1')?.textContent).toBe(brand.label);
    expect(document.textContent).toContain(profile.intro);
    expect(schemas.find(schema => schema['@type'] === 'CollectionPage')).toMatchObject({
      url: metadata.alternates?.canonical, description: profile.intro
    });
    expect(schemas.find(schema => schema['@type'] === 'FAQPage').mainEntity).toEqual(profile.faqs.map(item => ({
      '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer }
    })));
    for (const faq of profile.faqs) {
      // Strip JSON-LD to prove the answer is visible-page content, not schema-only.
      const visible = parse(html);
      visible.querySelectorAll('script').forEach(script => script.remove());
      expect(visible.textContent).toContain(faq.question);
      expect(visible.textContent).toContain(faq.answer);
    }
    expect(document.textContent).toContain('EVO skeleton');
    expect(html).toContain(`/images/authorizations/${value}-dolls-authorized.jpg`);
    expect(html).not.toMatch(/model records|recorded body|medical-grade|hypoallergenic/);
  });
});
