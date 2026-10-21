import { describe, expect, it } from "vitest";
import { HALLOWEEN_2026, isHalloweenPreview, isHalloweenSpiderPath } from "@/lib/promotions/halloween2026";

describe("Halloween preview boundaries", () => {
  it("uses the locked flat USD offer, not either earlier tier", () => {
    expect(HALLOWEEN_2026.amountUsd).toBe(299);
    expect(HALLOWEEN_2026.headline).toBe("$299 off full-size dolls this Halloween");
  });
  it("never enables production implicitly, including when the preview flag is present", () => {
    expect(isHalloweenPreview({ NODE_ENV: "production", VERCEL_ENV: "production", DOLLWOW_HALLOWEEN_PREVIEW: "1" })).toBe(false);
    expect(isHalloweenPreview({ NODE_ENV: "test", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "another-branch" })).toBe(false);
    expect(isHalloweenPreview({ NODE_ENV: "test" })).toBe(false);
    expect(isHalloweenPreview({ NODE_ENV: "test", DOLLWOW_HALLOWEEN_PREVIEW: "1" })).toBe(true);
    expect(isHalloweenPreview({ NODE_ENV: "production", VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "codex/dol-217-halloween-preview" })).toBe(true);
  });
  it.each(["/", "/shop", "/shop/tpe", "/products/example", "/brands", "/brands/wm-dolls", "/promo", "/reviews"])("permits the approved shopping path %s", (path) => expect(isHalloweenSpiderPath(path)).toBe(true));
  it.each(["/cart", "/checkout", "/account", "/account/my-dolls", "/returns", "/support", "/shipping", "/privacy-policy", "/dollvue", "/dollvue/generate", "/api/cart/create", "/ops", "/products/example/checkout"])("keeps spiders off %s", (path) => expect(isHalloweenSpiderPath(path)).toBe(false));
});
