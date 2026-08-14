import { describe, expect, it } from "vitest";
import { GET } from "@/app/robots.txt/route";
import { CONTENT_SIGNAL, isPublicAgentResourcePath } from "@/lib/seo/contentSignals";

describe("AI content access signals", () => {
  it("allows retrieval and citation while declining model training", async () => {
    const response = GET();
    const robots = await response.text();

    expect(robots).toContain(`Content-Signal: ${CONTENT_SIGNAL}`);
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Sitemap: https://dollwow.com/sitemap.xml");
  });

  it("recognizes public machine-readable resources", () => {
    expect(isPublicAgentResourcePath("/llms.txt")).toBe(true);
    expect(isPublicAgentResourcePath("/markdown/learn/example")).toBe(true);
    expect(isPublicAgentResourcePath("/datasets/sex-doll-size-weight-2026.json")).toBe(true);
    expect(isPublicAgentResourcePath("/admin")).toBe(false);
  });
});
