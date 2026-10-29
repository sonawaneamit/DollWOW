import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { includedBuildPreviewEnabled } from "@/lib/customization/included-build-preview";

describe("included build private preview boundary", () => {
  it.each([
    {}, { DOL314_INCLUDED_BUILD_PREVIEW: "1", VERCEL_ENV: "production" },
    { DOL314_INCLUDED_BUILD_PREVIEW: "1", NODE_ENV: "production", NEXT_PUBLIC_VERCEL_ENV: "preview" },
    { VERCEL_ENV: "preview" }, { DOL314_INCLUDED_BUILD_PREVIEW: "1" }
  ])("does not activate without both the flag and an allowed environment %#", (env) => {
    expect(includedBuildPreviewEnabled(env)).toBe(false);
  });
  it("allows only explicitly flagged preview or local development", () => {
    expect(includedBuildPreviewEnabled({ DOL314_INCLUDED_BUILD_PREVIEW: "1", VERCEL_ENV: "preview" })).toBe(true);
    expect(includedBuildPreviewEnabled({ DOL314_INCLUDED_BUILD_PREVIEW: "1", NODE_ENV: "development", NEXT_PUBLIC_VERCEL_ENV: "preview" })).toBe(true);
  });
  it("keeps the preview noindex and both purchase surfaces disabled", () => {
    const page = readFileSync(new URL("../app/(store)/products/[handle]/page.tsx", import.meta.url), "utf8");
    expect(page).toContain("includedBuildPreviewEnabled() || isChikuPreview");
    expect(page).toContain("previewOnly={includedPreview || isChikuPreview(product)}");
    expect(page).toContain("draftPreview={isPrivateDraft || promotionPreview || includedPreview}");
  });
  it("keeps the shared mobile total untruncated and separate from the purchase CTA", () => {
    const component = readFileSync(new URL("../components/ProductOptions.tsx", import.meta.url), "utf8");
    const total = component.slice(component.indexOf('<div className="sticky top-24'), component.indexOf("{visibleGroups.map"));
    expect(total).toContain("Current total");
    expect(total).toContain("break-words");
    expect(total).not.toMatch(/truncate|text-ellipsis|line-clamp|Review &amp; Add/);
  });
});
