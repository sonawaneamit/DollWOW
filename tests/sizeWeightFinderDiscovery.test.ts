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
afterEach(() => vi.unstubAllGlobals());
describe('Finder discovery stays scoped to its canonical owner', () => {
  it('lists the one root URL in the sitemap, feeds and existing guide', async () => {
    const urls = Object.values(buildSitemapSegments([])).flat().map(row => row.url);
    expect(urls.filter(url => url.endsWith(path))).toEqual([`https://dollwow.com${path}`]);
    expect(urls.some(url => url.includes(`${path}?`))).toBe(false);
    const json = await agentIndex().json();
    expect(json.tools.filter((row: { url: string }) => row.url.endsWith(path))).toHaveLength(1);
    expect(await llms().text()).toContain(path);
    expect(getAgentKnowledgeRecords().filter(row => row.url.endsWith(path))).toHaveLength(1);
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
    const fetcher = vi.fn(async () => new Response('<html><main id="main-content"><h1>Doll Size &amp; Weight Finder</h1><p>Snapshot checked 2026-10-23. 1 missing weight.</p><h2>165 cm / TPE</h2><p>Body-only weights stay separate.</p><form><select><option>Private control state</option></select><button>Find weights</button></form><a href="/products/example">Matching listing</a></main></html>'));
    vi.stubGlobal('fetch', fetcher);
    const response = await markdown(new Request(`https://dollwow.com/markdown${path}`), { params: Promise.resolve({ path: ['tools', 'doll-size-weight-finder'] }) });
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledWith(new URL(`https://dollwow.com${path}`), expect.objectContaining({ cache: 'no-store' }));
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, follow');
    const text = await response.text();
    expect(text).toContain('1 missing weight');
    expect(text).toContain('Body-only weights stay separate.');
    expect(text).toContain('Matching listing');
    expect(text).not.toContain('Private control state');
  });
});
