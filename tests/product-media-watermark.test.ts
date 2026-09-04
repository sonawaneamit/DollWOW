import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("product-media watermark loading", () => {
  it("loads the brand lockup from public disk instead of HTTP self-fetch", () => {
    const source = readFileSync(join(process.cwd(), "app/product-media/[handle]/[position]/route.ts"), "utf8");
    expect(source).toContain('join(process.cwd(), "public/images/brand/dollwow-black-gold-lockup.png")');
    expect(source).toContain("readFile");
    expect(source).not.toMatch(/watermarkLogo\(new URL\(/);
    expect(source).not.toMatch(/fetch\(url,\s*\{\s*next:\s*\{\s*revalidate:\s*86400/);
    const logo = readFileSync(join(process.cwd(), "public/images/brand/dollwow-black-gold-lockup.png"));
    expect(logo.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  it("falls back to the unwatermarked image when the lockup cannot be read", () => {
    const source = readFileSync(join(process.cwd(), "app/product-media/[handle]/[position]/route.ts"), "utf8");
    expect(source).toMatch(/Prefer a solid unwatermarked hero over a 500/);
    expect(source).toContain("watermarkLogoPromise = null");
  });
});
