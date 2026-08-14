import { describe, expect, it } from "vitest";
import { publicMainHtmlToMarkdown } from "@/lib/seo/htmlToMarkdown";
import { canonicalPathFromMarkdownSegments, isPublicMarkdownPath, markdownPathFor } from "@/lib/seo/publicMarkdownPath";

describe("sitewide Markdown representations", () => {
  it.each([
    "/",
    "/shop/sex-dolls",
    "/brands/irontech-dolls",
    "/products/example-product",
    "/learn/sex-doll-guide",
    "/care-for-life",
    "/factory-photos"
  ])("allows the public page %s", (path) => {
    expect(isPublicMarkdownPath(path)).toBe(true);
  });

  it.each([
    "/account/my-dolls",
    "/admin/price-match",
    "/api/search",
    "/cart",
    "/ops/doll-visualizer",
    "/search"
  ])("rejects private, transactional, or temporary route %s", (path) => {
    expect(isPublicMarkdownPath(path)).toBe(false);
  });

  it("maps canonical and Markdown paths predictably", () => {
    expect(markdownPathFor("/")).toBe("/markdown");
    expect(markdownPathFor("/shop/sex-dolls")).toBe("/markdown/shop/sex-dolls");
    expect(canonicalPathFromMarkdownSegments(["shop", "sex-dolls"])).toBe("/shop/sex-dolls");
  });

  it("extracts main content and omits scripts, navigation, and controls", () => {
    const markdown = publicMainHtmlToMarkdown(`
      <html><head><title>Sample | DollWow</title><meta name="description" content="A useful sample."></head>
      <body><header>Site navigation</header><main id="main-content"><h1>Sample page</h1><p>Buyer answer.</p><button>Do thing</button><script>secret()</script></main><footer>Footer</footer></body></html>
    `, "https://dollwow.com/sample");

    expect(markdown).toContain("# Sample page");
    expect(markdown).toContain("Buyer answer.");
    expect(markdown).toContain("Canonical: https://dollwow.com/sample");
    expect(markdown).not.toContain("Site navigation");
    expect(markdown).not.toContain("Do thing");
    expect(markdown).not.toContain("secret");
    expect(markdown).not.toContain("Footer");
  });
});
