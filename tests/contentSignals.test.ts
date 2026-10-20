import { describe, expect, it } from "vitest";
import { GET } from "@/app/robots.txt/route";
import { CONTENT_SIGNAL, isPublicAgentResourcePath } from "@/lib/seo/contentSignals";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("AI content access signals", () => {
  it("allows search, AI input and training while retaining crawl exclusions", async () => {
    const response = GET();
    const robots = await response.text();

    expect(robots).toContain(`Content-Signal: ${CONTENT_SIGNAL}`);
    expect(CONTENT_SIGNAL).toContain("ai-train=yes");
    expect(CONTENT_SIGNAL).not.toContain("ai-train=no");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /ops/");
    expect(robots).toContain("Disallow: /api/");
    expect(robots.match(/^User-Agent:/gim)).toHaveLength(1);
    expect(robots).toContain("Sitemap: https://dollwow.com/sitemap.xml");
  });

  it.each(["/brands/lusandy-dolls", "/llms.txt", "/product-feed.json", "/markdown/brands/lusandy-dolls"])("keeps the same training policy on %s responses", (path) => {
    const response = proxy(new NextRequest(`https://dollwow.com${path}`));
    expect(response.headers.get("Content-Signal")).toBe(CONTENT_SIGNAL);
  });

  it("recognizes public machine-readable resources", () => {
    expect(isPublicAgentResourcePath("/llms.txt")).toBe(true);
    expect(isPublicAgentResourcePath("/markdown/learn/example")).toBe(true);
    expect(isPublicAgentResourcePath("/datasets/sex-doll-size-weight-2026.json")).toBe(true);
    expect(isPublicAgentResourcePath("/admin")).toBe(false);
  });
});
