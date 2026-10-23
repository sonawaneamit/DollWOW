import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { getHeadReferencePreview, getHeadReferencePreviews } from "@/lib/references/headReferences";
import { buildSitemapSegments } from "@/lib/seo/sitemapSegments";
import { isPublicMarkdownPath } from "@/lib/seo/publicMarkdownPath";

afterEach(() => vi.unstubAllEnvs());

describe("bounded head reference previews", () => {
  it.each([undefined, "production", "development", "Preview", ""])("exposes no reference data for environment %s", environment => {
    vi.stubEnv("VERCEL_ENV", environment);
    expect(getHeadReferencePreviews()).toEqual([]);
    expect(getHeadReferencePreview("irontech-s44-ros-max")).toBeNull();
  });

  it("limits preview to exactly three known references and rejects unknown slugs", () => {
    expect(getHeadReferencePreviews("preview").map(row => row.slug)).toEqual(["irontech-s44-ros-max", "irontech-s19", "irontech-s40"]);
    expect(getHeadReferencePreview("irontech-s31", "preview")).toBeNull();
    expect(getHeadReferencePreview("../irontech-s19", "preview")).toBeNull();
  });

  it("records exact written pairings, not a body interchangeability list", () => {
    const refs = getHeadReferencePreviews("preview");
    for (const ref of refs) {
      expect(ref.answer).toContain(ref.code);
      expect(ref.answer).toContain(ref.body);
      expect(ref.sourceCheckedAt).toBe("2026-10-23");
      expect(new URL(ref.sourceUrl).origin).toBe("https://www.irontechdoll.com");
      expect(ref.sourceUrl).not.toContain("srsltid");
    }
    expect(getHeadReferencePreview("irontech-s44-ros-max", "preview")?.designation).toBe("ROS MAX");
    expect(getHeadReferencePreview("irontech-s19", "preview")?.designation).toBeUndefined();
    expect(getHeadReferencePreview("irontech-s40", "preview")?.designation).toBeUndefined();
  });

  it("keeps private research, supplier questions and unverified commercial facts out of the payload", () => {
    const serialized = JSON.stringify(getHeadReferencePreviews("preview"));
    expect(serialized).not.toMatch(/60\s*kg|37\.5|2.?5\s*kg|\$|IP.not.whitelisted|DOL-\d+|NEEDS|BLOCKED|agent-bypass|Kaia|bodyCodePresent|factoryVerifiedBodyOnlyKg/);
    expect(serialized).not.toMatch(/s40-eileen\//);
  });

  it("keeps all pages noindex and omits offer/review schema and public discovery changes", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { generateMetadata } = await import("@/app/reference/heads/[slug]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "irontech-s19" }) });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates).toBeUndefined();
    const page = fs.readFileSync("app/reference/heads/[slug]/page.tsx", "utf8");
    expect(page).toContain('if (!reference) notFound()');
    expect(page).not.toMatch(/application\/ld\+json|ProductCard|dangerouslySetInnerHTML/);
    expect(fs.existsSync("public/images/home-brands/irontech.png")).toBe(true);
    expect(Object.values(buildSitemapSegments([])).flat().some(row => row.url.includes("/reference/heads/"))).toBe(false);
    expect(isPublicMarkdownPath("/reference/heads/irontech-s19")).toBe(false);
  });

  it("returns the framework not-found response outside preview", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: Page } = await import("@/app/reference/heads/[slug]/page");
    await expect(Page({ params: Promise.resolve({ slug: "irontech-s19" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it.each(["irontech-s44-ros-max", "irontech-s19", "irontech-s40"])("renders source facts and cross-links in initial HTML for %s", async slug => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: Page } = await import("@/app/reference/heads/[slug]/page");
    const reference = getHeadReferencePreview(slug)!;
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) }));
    expect(parse(html).textContent).toContain(reference.answer);
    expect(html).toContain(reference.code);
    expect(html).toContain(reference.body);
    expect(html).toContain(`href="${reference.sourceUrl}"`);
    expect(html).toContain('href="/learn/irontech-head-types-ros-max"');
    expect(html).toContain('href="/brands/irontech-dolls"');
    expect(html).not.toMatch(/application\/ld\+json|164cm-title|IP.not.whitelisted|BLOCKED/);
  });
});
