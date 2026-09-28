import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideShoppingLinks } from "@/components/GuideShoppingLinks";
import { getLearningArticle } from "@/lib/learn/content";
import { MarkdownContent } from "@/components/MarkdownContent";

vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));

describe("buying guide shopping paths", () => {
  it("renders crawlable links to existing destinations without JavaScript", () => {
    const html = renderToStaticMarkup(<GuideShoppingLinks />);
    for (const href of ["/help-me-choose", "/shop/lightweight-sex-dolls", "/shop/ready-to-ship", "/brands"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('aria-label="Find your next step"');
  });
  it("has the existing quick-answer insertion point", () => {
    expect(getLearningArticle("sex-doll-guide")?.body).toContain("## Quick Answer");
  });
  it.each(["\n\n## Next Section\n\nNext paragraph.", ""])("keeps the direct answer ahead of shopping links (%s)", (tail) => {
    const html = renderToStaticMarkup(<MarkdownContent markdown={`## Quick Answer\n\nAnswer comes first.\n\n### More detail\n\nDetail also comes first.${tail}`} sectionInsertions={[{ afterHeading: "Quick Answer", placement: "after-section", content: <GuideShoppingLinks /> }]} />);
    expect(html.indexOf("Find a doll that fits")).toBeGreaterThan(html.indexOf("Detail also comes first."));
    if (tail) expect(html.indexOf("Find a doll that fits")).toBeLessThan(html.indexOf("Next Section"));
  });
});
