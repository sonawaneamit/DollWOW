import { describe, expect, it } from 'vitest';
import { getLearningArticle, buildArticleFaqStructuredData } from '@/lib/learn/content';

describe('DOL223 persuasive alternatives preview', () => {
  it('leads with concrete DollWOW buying reasons and linked actions', () => {
    const article = getLearningArticle('sexdolltech-alternatives')!;
    expect(article.body).toContain('Choose DollWOW for the doll you want');
    for (const url of ['/authorized-vendors','/compare','/shop/sex-dolls','/shop/custom','/care-for-life','/shipping']) expect(article.body).toContain(`](${url})`);
    expect(article.body).toContain('Why Buy Your Doll From DollWOW?');
    expect(article.body).not.toMatch(/May Be The Better Fit|Typical Comparison Problem|4 to 6 hours|cheapest|better than SexDollTech|SexDollTech (?:does not|doesn.t|never)/i);
  });
  it('keeps terms, stock and configuration qualifications without inventing competitive facts', () => {
    const article = getLearningArticle('sexdolltech-alternatives')!;
    expect(article.body).toContain('eligible custom orders');
    expect(article.body).toContain('Shipping and applicable taxes are separate where shown');
    expect(article.body).toContain('under the published terms');
    expect(article.body).toContain('Dispatch, carrier transit, customs, and final handoff remain separate stages');
    expect(article.author).toBe('alex');
    expect(article.lastReviewed).toBe('2026-08-12');
    expect(article.publishedAt).toBeUndefined();
    expect(buildArticleFaqStructuredData(article)?.mainEntity).toHaveLength(10);
  });
});
