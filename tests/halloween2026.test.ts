import { describe, expect, it } from "vitest";
import { HALLOWEEN_2026, isHalloweenPreview, isHalloweenSpiderPath, isHalloweenInWindow, isHalloweenVisible } from "@/lib/promotions/halloween2026";

describe("approved production window", () => {
  it("ends at the exact approved Lisbon winter-time boundary", () => {
    expect(isHalloweenInWindow(Date.parse("2026-11-08T23:58:59Z"))).toBe(true);
    expect(isHalloweenInWindow(Date.parse("2026-11-08T23:59:00Z"))).toBe(false);
    expect(isHalloweenInWindow(Date.parse("2026-10-20T23:59:00Z"))).toBe(false);
  });
  it("supports a kill switch and never enables an expired production campaign", () => {
    const now = Date.parse("2026-10-22T10:00:00Z");
    expect(isHalloweenVisible({ NODE_ENV: "production", VERCEL_ENV: "production" }, now)).toBe(true);
    expect(isHalloweenVisible({ NODE_ENV: "production", DOLLWOW_HALLOWEEN_ENABLED: "0" }, now)).toBe(false);
    expect(isHalloweenVisible({ NODE_ENV: "production", VERCEL_ENV: "production", DOLLWOW_HALLOWEEN_PREVIEW: "1" }, Date.parse("2026-11-09T00:00:00Z"))).toBe(false);
  });
});

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
