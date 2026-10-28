import {describe,it,expect} from 'vitest';
import {NextRequest} from 'next/server';
import {config,proxy} from '@/proxy';
import {isPublicMarkdownPath} from '@/lib/seo/publicMarkdownPath';

const path='/heads/irontech-s40';
describe('S40 actual proxy discovery boundary',()=>{
 it('matches only the approved exact head owner, not all reference routes',()=>{
  expect(config.matcher).toContain(path);
  expect(config.matcher).not.toContain('/heads/:path*');
  for(const p of ['/heads/irontech-s19','/heads/irontech-s44-ros-max','/review/references/irontech-s40']){
   expect(config.matcher).not.toContain(p);expect(isPublicMarkdownPath(p)).toBe(false);
  }
 });
 it('rewrites canonical Markdown requests and advertises the HTML alternate',()=>{
  const markdown=proxy(new NextRequest(`https://dollwow.com${path}`,{headers:{Accept:'text/markdown'}}));
  expect(markdown.headers.get('x-middleware-rewrite')).toBe(`https://dollwow.com/markdown${path}`);
  const html=proxy(new NextRequest(`https://dollwow.com${path}`,{headers:{Accept:'text/html'}}));
  expect(html.headers.get('link')).toContain(`/markdown${path}`);expect(html.headers.get('vary')).toBe('Accept');
 });
 it('avoids renderer recursion and leaves non-GET requests untouched',()=>{
  for(const request of [new NextRequest(`https://dollwow.com${path}`,{headers:{Accept:'text/markdown','x-dollwow-markdown-source':'1'}}),new NextRequest(`https://dollwow.com${path}`,{method:'POST',headers:{Accept:'text/markdown'}})]){
   expect(proxy(request).headers.get('x-middleware-rewrite')).toBeNull();
  }
 });
});
