import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Rosemary option ingestion guardrails", () => {
  it("does not silently cap option groups or visible group labels", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/scrape-rosemary.mjs"), "utf8");

    expect(source).not.toMatch(/extractOptionGroupLabels[\s\S]*?\.slice\(0,\s*30\)/);
    expect(source).not.toMatch(/extractOptionGroups[\s\S]*?\.slice\(0,\s*40\)/);
  });

  it("does not cap prepared public groups or options", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/prepare-rosemary-import.mjs"), "utf8");

    expect(source).not.toMatch(/\.slice\(0,\s*36\)/);
    expect(source).not.toMatch(/\.slice\(0,\s*48\)/);
  });
});
