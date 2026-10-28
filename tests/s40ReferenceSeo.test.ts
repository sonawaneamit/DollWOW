import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {s40ReferenceMetadata,s40ReferenceStructuredData,s40ReferenceUrl} from '@/lib/learn/s40ReferenceSeo';
import {s40CardLabel,s40ReaderHandles} from '@/lib/learn/s40Pilot';
import {isPublicMarkdownPath} from '@/lib/seo/publicMarkdownPath';
import {buildSitemapSegments} from '@/lib/seo/sitemapSegments';
import {brandRelatedLinks} from '@/lib/catalog/brandSeo';
import {getCatalogBrand} from '@/lib/catalog/brands';

describe('one approved S40 public owner',()=>{
 it('sets the exact canonical/Markdown owner and production-only indexing',()=>{
  const m=s40ReferenceMetadata('production');
  expect(m.alternates?.canonical).toBe('/heads/irontech-s40');
  expect(m.alternates?.types).toEqual({'text/markdown':'/markdown/heads/irontech-s40'});
  expect(m.robots).toEqual({index:true,follow:true});
  expect(s40ReferenceMetadata('preview').robots).toEqual({index:false,follow:false});
  expect(isPublicMarkdownPath('/heads/irontech-s40')).toBe(true);
  for(const p of ['/heads/irontech-s19','/heads/irontech-s44-ros-max','/review/references/irontech-s40'])expect(isPublicMarkdownPath(p)).toBe(false);
 });
 it('describes exactly visible listed builds without invented offers or universal fit',()=>{
  const entries=s40ReaderHandles.map(handle=>({handle,name:s40CardLabel(handle)}));
  const [page,breadcrumb]=s40ReferenceStructuredData(entries);
  expect(page.url).toBe(s40ReferenceUrl);expect(page.mainEntity?.numberOfItems).toBe(14);
  expect(page.mainEntity?.itemListElement.map(e=>e.url)).toEqual(entries.map(e=>`https://dollwow.com/products/${e.handle}`));
  expect(breadcrumb['@type']).toBe('BreadcrumbList');
  expect(JSON.stringify([page,breadcrumb])).not.toMatch(/"offers"|"review"|"aggregateRating"|universal/);
 });
 it('adds only S40 discovery and keeps other head/body pilots out',()=>{
  const urls=Object.values(buildSitemapSegments([])).flat().map(e=>e.url);
  expect(urls.filter(url=>url.includes('/heads/'))).toEqual([s40ReferenceUrl]);
  expect(brandRelatedLinks(getCatalogBrand('irontech-dolls')!).some(l=>l.href==='/heads/irontech-s40')).toBe(true);
  expect(brandRelatedLinks(getCatalogBrand('wm-doll')!).some(l=>l.href==='/heads/irontech-s40')).toBe(false);
 });
 it('preserves the private route gate and all reviewed visible copy',()=>{
  const route=fs.readFileSync('app/review/references/irontech-s40/page.tsx','utf8');
  expect(route).toContain('s40PilotEnabled(process.env.VERCEL_ENV)');expect(route).toContain('index:false,follow:false');
  const page=fs.readFileSync('components/reference/S40ReferencePage.tsx','utf8');
  expect(page).toContain('Irontech calls this face S40, a useful name to look for across her different builds.');
  expect(page).toContain('Preview outfits and settings are illustrative, not included accessories.');
  expect(page).not.toContain('s40PilotEnabled');
 });
});
