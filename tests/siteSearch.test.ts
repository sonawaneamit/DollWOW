import { describe, expect, it } from "vitest";
import { searchSiteContent } from "@/lib/search/content";
import fs from "node:fs";
import path from "node:path";

describe("site content search", () => {
  it("finds Learning Center guides", () => {
    const results = searchSiteContent("clean a doll");
    expect(results.some((result) => result.kind === "Guide" && result.href.includes("how-to-clean"))).toBe(true);
  });

  it("finds useful storefront pages", () => {
    const results = searchSiteContent("shipping delivery");
    expect(results.some((result) => result.kind === "Page" && result.href === "/shipping")).toBe(true);
  });

  it("does not surface unrelated content", () => {
    expect(searchSiteContent("zzzznotfound")).toEqual([]);
  });

  it("routes general search submissions to unified search rather than product filters", () => {
    const header = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(header).toContain("`/search?q=${encodeURIComponent(trimmed)}`");
    expect(header).not.toContain("router.push(trimmed ? `/shop/sex-dolls?query=");
  });

  it("routes the single all-results action to unified search", () => {
    const header = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");
    expect(header).toContain('href={`/search?q=${encodeURIComponent(trimmedQuery)}`}');
    expect(header).toContain('<span>See all results for “{trimmedQuery}”</span>');
    expect(header).not.toContain('<span>See all dolls for');
  });
});
