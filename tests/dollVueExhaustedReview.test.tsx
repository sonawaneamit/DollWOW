import {afterEach,expect,it,vi} from 'vitest';
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('not-found');}}));
import Page from '@/app/review/dollvue-exhausted/page';
afterEach(()=>vi.unstubAllEnvs());
it('is unavailable in production even when someone knows the review URL',()=>{
  vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('NODE_ENV','production');
  expect(()=>Page()).toThrow('not-found');
});
it('renders a labelled fixture using the real component with zero allowance and generation off',()=>{
  vi.stubEnv('VERCEL_ENV','preview');
  const page=Page();const component=page.props.children[1];
  expect(component.props.initialRemaining).toBe(0);expect(component.props.live).toBe(false);
  expect(component.props.groups).toEqual([]);
});
