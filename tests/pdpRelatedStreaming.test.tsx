import React, { Suspense } from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream, renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import ts from 'typescript';
import { ProductRelatedContent } from '@/components/product/ProductRelatedContent';
import { ProductLowerAlive } from '@/components/ProductLowerAlive';
import { getProducts } from '@/lib/shopify/storefront';
import { getCatalogBrand } from '@/lib/catalog/brands';
import { scoreSimilarProducts } from '@/lib/catalog/similar';
import { publicProductPayload } from '@/lib/catalog/publicPayload';
import { withProtectedProductImages } from '@/lib/catalog/productImage';
import { dealerPublicTags, keepsWizardOpen } from '@/lib/customization/dealerPreviewBuilder';
import { sampleProducts } from '@/lib/data/sample-products';

vi.mock('@/lib/shopify/storefront', () => ({ getProducts: vi.fn() }));
const product = sampleProducts[0];
const publicProduct = publicProductPayload(withProtectedProductImages(product));
beforeEach(() => { vi.mocked(getProducts).mockReset(); });

describe('selected PDP independent of related catalog read', () => {
  it('streams the selected product while the related read remains pending', async () => {
    vi.mocked(getProducts).mockImplementation(() => new Promise(() => {}));
    const shell = await new Promise<string>((resolve, reject) => {
      const output = new PassThrough();
      let html = '';
      const stream = renderToPipeableStream(<main><h1>Verified selected product</h1>
        <Suspense fallback={<p role="status">Loading related products</p>}>
          <ProductRelatedContent product={product} publicProduct={publicProduct} />
        </Suspense></main>, {
        onShellReady() { stream.pipe(output); }, onShellError: reject,
        onError() { /* The deliberately pending fixture is aborted after its shell. */ }
      });
      output.on('data', chunk => {
        html += chunk.toString();
        if (html.includes('Loading related products')) { resolve(html); stream.abort(); }
      });
    });
    expect(shell).toContain('Verified selected product');
    expect(shell).toContain('Loading related products');
    expect(getProducts).toHaveBeenCalledOnce();
  });

  it('retains the exact query, ranking, card projection, practical content and source objects', async () => {
    const before = structuredClone(sampleProducts);
    vi.mocked(getProducts).mockResolvedValue(sampleProducts);
    const result = await ProductRelatedContent({ product, publicProduct });
    const brand = getCatalogBrand(product.extended.brand ?? product.vendor);
    const tag = brand?.tags[0] ?? brand?.value;
    expect(getProducts).toHaveBeenCalledExactlyOnceWith({
      query: tag ? `tag:${JSON.stringify(tag)}` : `title:${JSON.stringify(product.extended.brand ?? product.vendor)}`,
      first: 600, imageFirst: 1, revalidate: 3600,
      cacheKey: `pdp-related-brand-v3-${(brand?.value ?? product.extended.brand ?? product.vendor).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    });
    const alternatives = scoreSimilarProducts(product, sampleProducts, 5).map(withProtectedProductImages).map(publicProductPayload)
      .map(item => keepsWizardOpen(product.handle) ? { ...item, tags: dealerPublicTags(item.tags) ?? item.tags } : item);
    expect(renderToStaticMarkup(result)).toBe(renderToStaticMarkup(<ProductLowerAlive product={publicProduct} similarProducts={alternatives} />));
    expect(result.props.product).toBe(publicProduct);
    expect(sampleProducts).toEqual(before);
  });

  it('places only the related section behind the boundary, retaining selected reads and configuration', () => {
    const text = fs.readFileSync('app/(store)/products/[handle]/page.tsx', 'utf8');
    const source = ts.createSourceFile('pdp.tsx', text, ts.ScriptTarget.Latest, true);
    let boundaries = 0;
    function visit(node: ts.Node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'Suspense') {
        expect(node.getText(source)).toContain('<ProductRelatedContent product={product} publicProduct={publicProduct}');
        expect(node.getText(source)).not.toContain('<ProductOptions');
        boundaries++;
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    expect(boundaries).toBe(1);
    expect(text).not.toContain('await getProducts(');
    expect(text).toContain('getProductByHandle(handle, dealerPreviewProductFetch(handle))');
    expect(text).toContain('getProductAdminMetafieldsByHandle(handle)');
    expect(text).toContain('const templateRecipe = await loadTemplateRecipe(product)');
    expect(text).toContain('<ProductOptions product={publicProduct} config={packCustomizationConfig(customizationConfig)}');
    expect(text).toContain('<ProductGallery product={publicProduct}');
  });
});
