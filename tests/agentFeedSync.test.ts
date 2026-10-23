import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/learn/content', async importOriginal => {
  const original = await importOriginal<typeof import('@/lib/learn/content')>();
  const records = [
    { slug: 'published-sample', title: 'Published sample', status: 'production', publishedAt: '2026-01-01T00:00:00Z' },
    { slug: 'scheduled-visible-sample', title: 'Scheduled visible', status: 'scheduled', publishedAt: '2026-01-02T00:00:00Z' },
    { slug: 'private-draft-sample', title: 'Private draft', status: 'draft' },
    { slug: 'future-sample', title: 'Future sample', status: 'scheduled', publishedAt: '2099-01-01T00:00:00Z' }
  ];
  return { ...original, getLearningArticles: () => records.filter(record => original.isLearningArticleVisible(record)) };
});
import { GET as textFeed } from '@/app/llms.txt/route';
import { GET as jsonFeed } from '@/app/agent-index.json/route';
describe('existing agent-feed publication synchronization', () => {
  it('discovers published and due scheduled guides without duplicating a hand-maintained list', async () => {
    const text = await textFeed().text(), json = await jsonFeed().json();
    for (const slug of ['published-sample', 'scheduled-visible-sample']) {
      expect(text).toContain(`/learn/${slug}`);
      expect(json.guides.map((guide: { slug: string }) => guide.slug)).toContain(slug);
    }
    for (const slug of ['private-draft-sample', 'future-sample']) {
      expect(text).not.toContain(slug); expect(JSON.stringify(json)).not.toContain(slug);
    }
    expect(text).toContain('/sitemap.xml'); expect(text).toContain('/product-feed.json');
    expect(json.retrieval.canonicalInventory).toBe('https://dollwow.com/sitemap.xml');
    expect(json.retrieval.catalogInventory).toBe('https://dollwow.com/product-feed.json');
  });
});
