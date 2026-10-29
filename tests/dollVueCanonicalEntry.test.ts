import {NextRequest} from 'next/server';
import {expect,it,vi} from 'vitest';
vi.mock('@/lib/utils/env',()=>({env:{},hasAdminBasicAuthEnv:()=>false}));
import {config,proxy} from '@/proxy';

it.each(['GET','HEAD'])('canonicalizes private www entry for %s without widening cookie scope',method=>{
  const result=proxy(new NextRequest('https://www.dollwow.com/dollvue/verify?token=synthetic-only',{method}));
  expect(result.status).toBe(307);
  expect(result.headers.get('location')).toBe('https://dollwow.com/dollvue/verify?token=synthetic-only');
  expect(result.headers.get('cache-control')).toBe('private, no-store');
  expect(result.headers.get('referrer-policy')).toBe('no-referrer');
  expect(result.headers.has('set-cookie')).toBe(false);
});
it.each(['https://dollwow.com/dollvue/example','https://preview.vercel.app/dollvue/example',
  'https://www.dollwow.com/dollvue-not-private'])('does not redirect unrelated host/path %s',url=>{
  expect(proxy(new NextRequest(url)).headers.get('location')).toBeNull();
});
it('does not replay or redirect POST requests to another origin',()=>{
  const result=proxy(new NextRequest('https://www.dollwow.com/dollvue/access',{method:'POST'}));
  expect(result.headers.get('location')).toBeNull();
});
it('includes private leaf routes in the actual proxy matcher',()=>{
  expect(config.matcher).toContain('/dollvue/:path*');
});
