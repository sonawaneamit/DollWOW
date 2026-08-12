import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile header", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");

  it("places search immediately before comparison controls", () => {
    const mobileControls = source.slice(source.indexOf('className="ml-auto flex items-center gap-1 sm:gap-2 lg:hidden"'));
    expect(mobileControls.indexOf('aria-label="Search products"')).toBeLessThan(mobileControls.indexOf("aria-label={compareLabel(compareCount)}"));
  });

  it("anchors the open menu below the sticky header after scrolling", () => {
    expect(source).toContain('id="mobile-menu" className="absolute inset-x-0 top-full');
    expect(source).toContain("h-[calc(100dvh-72px)]");
    expect(source).not.toContain('id="mobile-menu" className="fixed');
  });

  it("keeps the mobile controls compact without reducing their icon control targets", () => {
    expect(source).toContain("site-header__wordmark");
    expect(source).toContain("site-header__menu-control");
    expect(source).toContain('className="v2-icon-control" aria-label="Search products"');
  });
});
