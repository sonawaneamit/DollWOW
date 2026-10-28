import { describe, expect, it } from 'vitest';
import { buildArticleFaqStructuredData, buildArticleStructuredData, getLearningArticle } from '@/lib/learn/content';

describe('DOL223 approved non-comparison guide release', () => {
  for (const [slug, reviewed, count] of [
    ['most-realistic-sex-dolls', '2026-08-11', 10],
    ['custom-sex-dolls', '2026-08-12', 12],
    ['implanted-hair-vs-wig', '2026-08-11', 12]
  ] as const) {
    it(`preserves metadata and FAQ ownership for ${slug}`, () => {
      const article = getLearningArticle(slug)!;
      expect(article.status).toBe('production');
      expect(article.author).toBe('alex');
      expect(article.lastReviewed).toBe(reviewed);
      expect(article.publishedAt).toBeUndefined();
      expect(new URL(buildArticleStructuredData(article).url).pathname).toBe(`/learn/${slug}`);
      expect(buildArticleFaqStructuredData(article)?.mainEntity).toHaveLength(count);
      expect(article.body).not.toMatch(/listed dry weight|Exact dry weight|PDP|SERP|keyword cluster|crawlable/);
    });
  }
  it('keeps the approved realism worksheet without an invented universal winner', () => {
    const body = getLearningArticle('most-realistic-sex-dolls')!.body;
    expect(body).toContain("We haven't tested every doll side by side");
    expect(body).toContain('an unspecified figure is not a verified complete-doll weight');
    expect(body).toContain('/shop/realistic-sex-dolls');
  });
  it('keeps exact-build records distinct from shopping availability', () => {
    const body = getLearningArticle('custom-sex-dolls')!.body;
    expect(body).toContain('A Build Record You Can Actually Check');
    expect(body).toContain('Options vary by doll');
    expect(body).toContain('for the current options');
  });
  it('does not turn an accessory package into a supported hair specification', () => {
    const article = getLearningArticle('implanted-hair-vs-wig')!;
    expect(article.body).toContain("the accessory list doesn't give those details");
    expect(article.body).toContain("Don't guess a styling temperature");
    expect(buildArticleStructuredData(article).citation).toContain('https://www.irontechdoll.com/help-faq/');
  });
});
