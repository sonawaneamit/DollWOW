import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types/product';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ local: vi.fn(), config: vi.fn() }));
vi.mock('@/lib/customization/template-review-loader', () => ({ loadLocalTemplateRecipe: mocks.local }));
vi.mock('@/lib/customization/configs', () => ({ getCustomizationConfig: mocks.config }));
import { loadTemplateRecipe } from '@/lib/customization/template-loader';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('PDP loader integration', () => {
  it('preserves the current unenabled production behavior', async () => {
    mocks.local.mockResolvedValue(undefined); vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '0');
    expect(await loadTemplateRecipe({} as Product)).toBeUndefined();
    expect(mocks.config).not.toHaveBeenCalled();
  });
  it('does not grant presets to products outside the reviewed registry', async () => {
    mocks.local.mockResolvedValue(undefined); vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '1');
    expect(await loadTemplateRecipe({ id: 'unknown', extended: {}, tags: [] } as unknown as Product)).toBeNull();
  });
  it('keeps local review and its held products separate from release fallback', async () => {
    mocks.local.mockResolvedValue(null); vi.stubEnv('DOLLWOW_TEMPLATE_RELEASE', '1');
    expect(await loadTemplateRecipe({} as Product)).toBeNull();
    expect(mocks.config).not.toHaveBeenCalled();
    const recipe = { tag: 'options:test-only' }; mocks.local.mockResolvedValue(recipe);
    expect(await loadTemplateRecipe({} as Product)).toBe(recipe);
  });
});
