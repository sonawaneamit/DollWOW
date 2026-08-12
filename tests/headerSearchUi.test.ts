import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("header catalog search", () => {
  it("places one clear full-catalog action after quick matches on desktop and mobile", () => {
    const headerSource = fs.readFileSync(path.join(process.cwd(), "components/Header.tsx"), "utf8");

    expect(headerSource).toContain('data-testid="search-all-results"');
    expect(headerSource).toContain("See all results for “{trimmedQuery}”");
    expect(headerSource).toContain("<AllSearchResultsLink query={searchQuery} onNavigate={onNavigate} compact />");
    expect(headerSource).toContain("<AllSearchResultsLink query={searchQuery} onNavigate={onNavigate} />");
    expect(headerSource).not.toContain('kind: "Catalog"');
  });
});
