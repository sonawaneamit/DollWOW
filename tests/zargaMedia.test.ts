import { afterEach, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { zargaPreviewProduct, ZARGA_HANDLE } from '@/lib/catalog/zargaPreview';
import { GET } from '@/app/product-media/[handle]/[position]/route';

vi.mock('@/lib/shopify/storefront', () => ({ getProductByHandle: vi.fn(async () => zargaPreviewProduct()) }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('serves all 26 owned preview images through the protected route without HTTP self-fetch', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('DOLLWOW_ZARGA_PREVIEW', '1');
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  for (let position = 0; position < 26; position++) {
    const response = await GET(new Request(`https://preview.example/product-media/${ZARGA_HANDLE}/${position}?size=thumb`), { params: Promise.resolve({ handle: ZARGA_HANDLE, position: String(position) }) });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/webp');
    const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  }
  expect(fetch).not.toHaveBeenCalled();
});
