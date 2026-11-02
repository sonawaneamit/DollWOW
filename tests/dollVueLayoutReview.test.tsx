import { afterEach, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('not-found'); } }));
import Page from '@/app/review/dollvue-layout/page';

afterEach(() => vi.unstubAllEnvs());

it('does not expose the layout fixture in production', () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('NODE_ENV', 'production');
  expect(() => Page()).toThrow('not-found');
});

it('uses only neutral owned fixtures with no generation allowance', () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  const component = Page().props.children[1];
  expect(component.props.live).toBe(false);
  expect(component.props.initialRemaining).toBe(0);
  expect(component.props.freePreviews).toBe(0);
  expect(component.props.groups).toHaveLength(8);
  expect(component.props.product.photos.every((photo: { url: string }) => photo.url === '/option-swatches/care-kit.svg')).toBe(true);
});
