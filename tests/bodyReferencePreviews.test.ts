import fs from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "node-html-parser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getBodyReferencePreview, getBodyReferencePreviews, referenceInches, referencePounds } from "@/lib/references/bodyReferences";
import { buildSitemapSegments } from "@/lib/seo/sitemapSegments";
import { isPublicMarkdownPath } from "@/lib/seo/publicMarkdownPath";

afterEach(() => vi.unstubAllEnvs());

describe("source-bounded body reference previews", () => {
  it.each([undefined, "production", "development", "Preview", ""])("keeps data unavailable for environment %s", environment => {
    vi.stubEnv("VERCEL_ENV", environment);
    expect(getBodyReferencePreviews()).toEqual([]);
    expect(getBodyReferencePreview("irontech-166cm-2-0-e")).toBeNull();
  });

  it("exposes exactly three sourced bodies after the original 164LN chart was located", () => {
    expect(getBodyReferencePreviews("preview").map(row => row.slug)).toEqual(["irontech-166cm-2-0-e", "irontech-171cm-d", "irontech-164ln"]);
    expect(getBodyReferencePreview("../irontech-171cm-d", "preview")).toBeNull();
  });

  it("preserves the exact distinct factory dimensions and body-only masses", () => {
    const bodies = getBodyReferencePreviews("preview").slice(0, 2);
    expect(bodies.map(row => row.measurements.map(m => m.cm))).toEqual([[166, 85, 65.3, 59.6, 98, 30], [171, 82, 63.5, 57.2, 93.5, 37]]);
    expect(bodies.map(row => row.bodyOnlyKg)).toEqual([37.5, 37.5]);
    for (const body of bodies) {
      expect(body.sourceCheckedAt).toBe("2026-10-23");
      expect(new URL(body.sourceUrl!).origin).toBe("https://www.irontechdoll.com");
    }
  });

  it("calculates conversions without changing source precision or adding a head range", () => {
    expect(referenceInches(2.54)).toBe("1.0");
    expect(referenceInches(166)).toBe("65.4");
    expect(referenceInches(171)).toBe("67.3");
    expect(referenceInches(59.6)).toBe("23.5");
    expect(referencePounds(0.45359237)).toBe("1.0");
    expect(referencePounds(37.5)).toBe("82.7");
  });

  it("has no unverified assembled mass, commercial data or private source questions", () => {
    const json = JSON.stringify(getBodyReferencePreviews("preview"));
    expect(json).not.toMatch(/2.?5\s*kg|\$|40207|BLOCKED|NEEDS|Kaia|agent-bypass|factoryVerifiedBodyOnlyKg|drive\.google|mail\.google/);
    expect(json).not.toContain('"assembledWeight');
    expect(json).not.toContain('"price');
  });

  it("transcribes the exact 164LN chart without borrowing a head mass, cup or public URL", () => {
    const body = getBodyReferencePreview("irontech-164ln", "preview")!;
    expect(body.designation).toBe("164LN");
    expect(body.bodyOnlyKg).toBe(60);
    expect(body.material).toBe("Silicone");
    expect(body.measurements.map(row => row.cm)).toEqual([164, 98, 67.8, 64.2, 121.2, 35.5, 68, 75, 68.8, 36.7, 23]);
    expect(body.sourceUrl).toBeUndefined();
    expect(body.sourceNote).toBeUndefined();
    expect(body.sourceTitle).toBe("Irontech factory body chart");
    expect(JSON.stringify(body)).not.toMatch(/M16|M12|M8|transcribed|19 August/);
    expect(JSON.stringify(body)).not.toMatch(/E-cup|D-cup|metal skeleton|2-5|assembledWeight|60\s*\+/);
  });

  it("renders the third chart with explicit body-only weight and a non-linked source", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: Page, generateMetadata } = await import("@/app/reference/bodies/[slug]/page");
    const params = Promise.resolve({ slug: "irontech-164ln" });
    const html = renderToStaticMarkup(await Page({ params }));
    const dom = parse(html);
    expect(dom.querySelectorAll("table tbody tr")).toHaveLength(11);
    expect(dom.textContent).toContain("60kg");
    expect(dom.textContent).toContain("132.3lb");
    expect(dom.textContent).toContain("Weight without head");
    expect(dom.textContent).toContain("Irontech factory body chart");
    expect(dom.textContent).toContain("Fit with other head and body combinations isn't confirmed.");
    expect(dom.textContent).not.toMatch(/Factory source checked|2026-10-23|19 August|transcribed|Factory evidence|Do not|does not establish|one dated manufacturer|1lb =|new factory measurements/);
    expect(dom.textContent).toContain("121.2");
    expect(html).not.toMatch(/drive\.google|mail\.google|href="undefined"|application\/ld\+json/);
    expect((await generateMetadata({ params })).robots).toEqual({ index: false, follow: false });
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Page({ params })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("returns framework404 outside preview and keeps metadata noindex", async () => {
    const { default: Page, generateMetadata } = await import("@/app/reference/bodies/[slug]/page");
    vi.stubEnv("VERCEL_ENV", "production");
    await expect(Page({ params: Promise.resolve({ slug: "irontech-171cm-d" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await generateMetadata({ params: Promise.resolve({ slug: "irontech-171cm-d" }) })).robots).toEqual({ index: false, follow: false });
    expect((await generateMetadata({ params: Promise.resolve({ slug: "irontech-171cm-d" }) })).alternates).toBeUndefined();
    expect(Object.values(buildSitemapSegments([])).flat().some(row => row.url.includes("/reference/bodies/"))).toBe(false);
    expect(isPublicMarkdownPath("/reference/bodies/irontech-171cm-d")).toBe(false);
  });

  it.each(["irontech-166cm-2-0-e", "irontech-171cm-d"])("renders a fully readable source table without client JavaScript for %s", async slug => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: Page } = await import("@/app/reference/bodies/[slug]/page");
    const reference = getBodyReferencePreview(slug)!;
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug }) }));
    const dom = parse(html);
    expect(dom.textContent).toContain(reference.answer);
    expect(dom.querySelectorAll("table tbody tr")).toHaveLength(6);
    expect(dom.querySelectorAll('th[scope="row"]')).toHaveLength(6);
    expect(dom.textContent).toContain("37.5kg");
    expect(dom.textContent).toContain("82.7lb");
    expect(dom.textContent).toContain("Weight without head");
    expect(dom.textContent).toContain("Fit with other head and body combinations isn't confirmed.");
    expect(dom.textContent).not.toMatch(/Factory source checked|2026-10-23|Factory evidence|Do not|does not establish|one dated manufacturer|1lb =|new factory measurements/);
    expect(html).toContain(`href="${reference.sourceUrl}"`);
    expect(html).not.toContain("application/ld+json");
    expect(fs.existsSync("public/images/home-brands/irontech.png")).toBe(true);
  });
});
