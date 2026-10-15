import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { keepsWizardOpen, presetSelectLayout } from "@/lib/customization/dealerPreviewBuilder";

const lily = "funwest-dolls-lily-157cm-g-cup-silicone-companion-doll-fsd052";
const grace = "top-fire-doll-grace-162cm-i-cup-silicone-companion-doll";

describe("FunWest/Top Fire preset clicks keep the wizard open", () => {
  it("never collapses or auto-scrolls on dealer previews", () => {
    for (const handle of [lily, grace]) {
      expect(keepsWizardOpen(handle)).toBe(true);
      expect(presetSelectLayout(handle, 0)).toEqual({ collapseWizard: false, scrollToPurchase: false });
    }
  });
  it("leaves other brands unchanged", () => {
    expect(keepsWizardOpen("irontech-celine-164cm-d-cup-silicone-head-companion-doll-s38se")).toBe(false);
    expect(presetSelectLayout("md-doll-x", 0)).toEqual({ collapseWizard: true, scrollToPurchase: true });
    expect(presetSelectLayout("md-doll-x", 1)).toEqual({ collapseWizard: true, scrollToPurchase: false });
  });
  it("ProductOptions routes the preset click through presetSelectLayout", () => {
    const src = fs.readFileSync("components/ProductOptions.tsx", "utf8");
    const onSelect = src.slice(src.indexOf("<ConfigurationPresets"), src.indexOf("trackEvent(\"configuration_preset_selected\""));
    expect(onSelect).toContain("presetSelectLayout(product.handle");
    expect(onSelect).not.toMatch(/^\s*setManualExpanded\(false\);/m);
    expect(onSelect).not.toMatch(/router\.|location|href/);
  });
});
