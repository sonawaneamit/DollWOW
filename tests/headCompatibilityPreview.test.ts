import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { getLearningArticle, isLearningArticleVisible } from '@/lib/learn/content';
import { getHeadCompatibilityPreviewArticle, isHeadCompatibilityPreviewEnabled } from '@/lib/learn/headCompatibilityPreview';

afterEach(() => vi.unstubAllEnvs());

describe('head compatibility private preview', () => {
  it.each([undefined, 'production', 'development'])('stays disabled in %s even with the flag', environment => {
    expect(isHeadCompatibilityPreviewEnabled({ VERCEL_ENV: environment, DOLLWOW_HEAD_FIT_PREVIEW: '1' })).toBe(false);
  });

  it('requires the deployment-only flag in Preview', () => {
    expect(isHeadCompatibilityPreviewEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(isHeadCompatibilityPreviewEnabled({ VERCEL_ENV: 'preview', DOLLWOW_HEAD_FIT_PREVIEW: '1' })).toBe(true);
  });

  it('returns no scheduled article outside the review gate', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('DOLLWOW_HEAD_FIT_PREVIEW', '1');
    expect(getHeadCompatibilityPreviewArticle()).toBeNull();
  });

  it('preserves the normal publication boundary and Alex', () => {
    const at = Date.parse('2026-10-30T10:00:00.000Z');
    expect(getLearningArticle('doll-replacement-head-compatibility', at - 1)).toBeNull();
    const article = getLearningArticle('doll-replacement-head-compatibility', at)!;
    expect(article.author).toBe('alex');
    expect(article.publishedAt).toBe('2026-10-30T10:00:00.000Z');
    expect(isLearningArticleVisible(article, at)).toBe(true);
  });

  it('keeps factory statements bounded and unconfirmed adapters explicit', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('DOLLWOW_HEAD_FIT_PREVIEW', '1');
    const article = getHeadCompatibilityPreviewArticle()!;
    expect(article.body).toContain('M8 applies to all dolls currently on sale and that it offers no adapter');
    expect(article.body).toContain('not a measured thread specification or proof of cross-brand fit');
    expect(article.body).toContain('conflicting M8/M12 descriptions for Zelex');
    expect(article.body).toMatch(/no independently verified replacement pair/i);
    expect(article.body).toContain('Do not silently expand an M16-only statement');
  });

  it('does not add the review route to public discovery', () => {
    const route = fs.readFileSync('app/review/head-compatibility/page.tsx', 'utf8');
    expect(route).toContain('index: false, follow: false');
    expect(route).toContain('if (!article) notFound()');
    expect(fs.readFileSync('app/learn/[slug]/page.tsx', 'utf8')).not.toContain('getHeadCompatibilityPreviewArticle');
  });
});
