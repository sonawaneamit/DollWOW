import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile catalog filters", () => {
  it("starts the sidebar controls collapsed even when filters are active", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "components/ProductFilters.tsx"), "utf8");
    expect(source).toContain("useState(false)");
    expect(source).toContain("aria-controls={mobilePanelId}");
    expect(source).not.toContain("useState(count > 0)");
  });

  it("hides the expanded active-filter panel with the controls on compact layouts", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "app/v2-storefront.css"), "utf8");
    expect(css).toContain(".product-filters--sidebar:not(.product-filters--mobile-open) .product-filters__active");
  });
});
