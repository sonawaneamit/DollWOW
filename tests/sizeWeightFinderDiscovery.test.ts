import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as agentIndex } from '@/app/agent-index.json/route';
import { GET as llms } from '@/app/llms.txt/route';
import { GET as markdown } from '@/app/markdown/[[...path]]/route';
import { getAgentKnowledgeRecords } from '@/lib/seo/agentKnowledge';
import { buildSitemapSegments } from '@/lib/seo/sitemapSegments';
import { isPublicMarkdownPath } from '@/lib/seo/publicMarkdownPath';
import { getLearningArticle } from '@/lib/learn/content';
import { config } from '@/proxy';

const path = '/tools/doll-size-weight-finder';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Finder discovery stays scoped to its canonical owner', () => {
  it('lists the one root URL in the sitemap, feeds and existing guide', async () => {
    const urls = Object.values(buildSitemapSegments([])).flat().map(row => row.url);
    expect(urls.filter(url => url.endsWith(path))).toEqual([`https://dollwow.com${path}`]);
    expect(urls.some(url => url.includes(`${path}?`))).toBe(false);
    const json = await agentIndex().json();
    expect(json.tools.filter((row: { url: string }) => row.url.endsWith(path))).toHaveLength(1);
    expect(await llms().text()).toContain(path);
    expect(getAgentKnowledgeRecords().filter(row => row.url.endsWith(path))).toHaveLength(1);
    expect(getAgentKnowledgeRecords()[0].id).toBe('home');
    const guide = getLearningArticle('sex-doll-size-weight-guide')!;
    expect(guide.body).toContain(`](${path})`);
    expect(guide.lastReviewed).toBe('2026-08-12');
  });
  it('enables only this tool for the existing public Markdown and crawler handling', () => {
    expect(isPublicMarkdownPath(path)).toBe(true);
    expect(config.matcher).toContain(path);
    expect(isPublicMarkdownPath('/tools/private-draft')).toBe(false);
    expect(isPublicMarkdownPath(`${path}/private`)).toBe(false);
    expect(config.matcher).not.toContain('/tools/:path*');
  });
  it('renders dated source facts without controls and without stale Markdown caching', async () => {
    const fetcher = vi.fn(async () => new Response('<html><main id="main-content"><h1>Doll Size &amp; Weight Finder</h1><p>2 matching listings</p><h2>Example doll</h2><p>165 cm / 5 ft 5 in; 36.3 kg / 80.0 lb; $1,899</p><form><select><option>Private control state</option></select></form><a href="/products/example">Matching listing</a></main></html>'));
    vi.stubGlobal('fetch', fetcher);
    const response = await markdown(new Request(`https://dollwow.com/markdown${path}`), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledWith(new URL(`https://dollwow.com${path}`), expect.objectContaining({ cache: 'no-store' }));
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow');
    const text = await response.text();
    expect(text).toContain('2 matching listings');
    expect(text).toContain('36.3 kg / 80.0 lb; $1,899');
    expect(text).not.toMatch(/factory-confirmed|Listing data checked/);
    expect(text).toContain('Matching listing');
    expect(text).not.toContain('Private control state');
  });

  it('forwards only existing preview authorization to the exact deployment host', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('VERCEL_URL', 'doll-preview.vercel.app');
    const fetcher = vi.fn(async () => new Response('<main><h1>Finder</h1></main>'));
    vi.stubGlobal('fetch', fetcher);
    await markdown(new Request(`https://doll-preview.vercel.app/markdown${path}`, { headers: { Cookie: '_vercel_jwt=existing-preview-proof; customer_session=private' } }), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(fetcher).toHaveBeenCalledWith(new URL(`https://doll-preview.vercel.app${path}`), expect.objectContaining({ headers: expect.objectContaining({ Cookie: '_vercel_jwt=existing-preview-proof' }), redirect: 'manual' }));
  });

  it.each(['production', 'preview'])('never forwards cookies on a nondeployment origin in %s', async environment => {
    vi.stubEnv('VERCEL_ENV', environment); vi.stubEnv('VERCEL_URL', 'doll-preview.vercel.app');
    const fetcher = vi.fn(async () => new Response('<main><h1>Finder</h1></main>'));
    vi.stubGlobal('fetch', fetcher);
    await markdown(new Request(`https://dollwow.com/markdown${path}`, { headers: { Cookie: '_vercel_jwt=preview-proof; customer_session=private' } }), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(fetcher).toHaveBeenCalledWith(new URL(`https://dollwow.com${path}`), expect.objectContaining({ headers: expect.not.objectContaining({ Cookie: expect.anything() }) }));
  });

  it('does not turn an off-origin login redirect into public Markdown', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 302, headers: { Location: 'https://vercel.com/login' } }));
    vi.stubGlobal('fetch', fetcher);
    const response = await markdown(new Request(`https://dollwow.com/markdown${path}`), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(response.status).toBe(502); expect(fetcher).toHaveBeenCalledTimes(1);
    expect(await response.text()).not.toContain('Log in');
  });

  it('follows bounded same-origin public redirects without fetching private paths', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/learn/sex-doll-size-weight-guide' } })).mockResolvedValueOnce(new Response('<main><h1>Guide</h1></main>'));
    vi.stubGlobal('fetch', fetcher);
    const response = await markdown(new Request(`https://dollwow.com/markdown${path}`), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(response.status).toBe(200); expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await response.text()).toContain('Canonical: https://dollwow.com/learn/sex-doll-size-weight-guide');
    fetcher.mockReset().mockResolvedValue(new Response(null, { status: 302, headers: { Location: '/account/my-dolls' } }));
    expect((await markdown(new Request(`https://dollwow.com/markdown${path}`), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) })).status).toBe(502);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
