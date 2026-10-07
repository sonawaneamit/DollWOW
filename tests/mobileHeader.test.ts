import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import postcss from "postcss";

describe("mobile header", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");

  it("places search immediately before comparison controls", () => {
    const mobileControls = source.slice(source.indexOf('className="ml-auto flex items-center gap-1 sm:gap-2 lg:hidden"'));
    expect(mobileControls.indexOf('aria-label="Search products"')).toBeLessThan(mobileControls.indexOf("aria-label={compareLabel(compareCount)}"));
  });

  it("anchors the open menu below the sticky header after scrolling", () => {
    expect(source).toContain('id="mobile-menu" className="absolute inset-x-0 top-full');
    expect(source).toContain("h-[calc(100dvh-108px)]");
    expect(source).not.toContain('id="mobile-menu" className="fixed');
  });

  it("keeps the mobile controls compact without reducing their icon control targets", () => {
    expect(source).toContain("site-header__wordmark");
    expect(source).toContain("site-header__menu-control");
    expect(source).toContain('className="v2-icon-control" aria-label="Search products"');
  });

  it("limits the narrow-screen hiding rule to the duplicate shortcut and visible menu text", () => {
    const css = postcss.parse(fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8"));
    const rules: string[] = [];
    css.walkAtRules("media", media => {
      if (media.params !== "(max-width: 379px)") return;
      media.walkRules(rule => {
        if (!rule.selector.includes(".site-header")) return;
        rules.push(...rule.selectors);
        expect(rule.nodes.map(node => node.toString())).toEqual(["display: none"]);
      });
    });
    expect(rules).toEqual([".site-header .site-header__mobile-compare", ".site-header__menu-control > span"]);
  });

  it("keeps Compare in the mobile menu and preserves the menu button's accessible state", () => {
    expect(source.match(/className="site-header__mobile-compare v2-icon-control relative"/g)).toHaveLength(1);
    const links = source.slice(source.indexOf("const mobilePrimaryLinks"), source.indexOf("const helpLinks"));
    expect(links).toContain('{ label: "Compare dolls", href: "/compare" }');
    expect(source).toContain('aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}');
    expect(source).toContain('aria-expanded={mobileMenuOpen}');
    expect(source).toContain('aria-controls="mobile-menu"');
    expect(source).toContain('aria-label="DollWow home"');
  });
});
