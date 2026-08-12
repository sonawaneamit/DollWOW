import { describe, expect, it } from "vitest";
import {
  buildStorefrontThemeInitScript,
  DEFAULT_STOREFRONT_THEME,
  resolveStorefrontTheme
} from "@/lib/storefrontTheme";

describe("storefront theme defaults", () => {
  it("uses light mode for new customers and invalid saved values", () => {
    expect(DEFAULT_STOREFRONT_THEME).toBe("light");
    expect(resolveStorefrontTheme(null)).toBe("light");
    expect(resolveStorefrontTheme(undefined)).toBe("light");
    expect(resolveStorefrontTheme("system")).toBe("light");
  });

  it("preserves a returning customer's explicit choice", () => {
    expect(resolveStorefrontTheme("light")).toBe("light");
    expect(resolveStorefrontTheme("dark")).toBe("dark");
  });

  it("does not use a device dark-mode preference for first visits", () => {
    const script = buildStorefrontThemeInitScript();

    expect(script).toContain('localStorage.getItem("dollwow-theme")');
    expect(script).toContain("saved==='light'||saved==='dark'?saved");
    expect(script).not.toContain("matchMedia");
    expect(script).toContain(':"light"');
  });
});
