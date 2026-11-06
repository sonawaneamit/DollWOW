import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { keepsWizardOpen, dealerPreviewProductFetch, dealerPublicTags } from "@/lib/customization/dealerPreviewBuilder";
import { SE_ELF_FACTS } from '@/lib/customization/se-oct27-preview';
import gynoidApproved from '@/data/catalog/gynoid-approved-configurations.json';

const lily = "funwest-dolls-lily-157cm-g-cup-silicone-companion-doll-fsd052";
const grace = "top-fire-doll-grace-162cm-i-cup-silicone-companion-doll";

describe("preset purchase flow", () => {
  it("starts with the wizard expanded on FunWest and Top Fire listings", () => {
    expect(keepsWizardOpen(lily)).toBe(true);
    expect(keepsWizardOpen(grace)).toBe(true);
    expect(keepsWizardOpen("irontech-celine-164cm-d-cup-silicone-head-companion-doll-s38se")).toBe(false);
  });

  it("collapses manual options on preset selection and waits for required choices before scrolling", () => {
    const src = fs.readFileSync("components/ProductOptions.tsx", "utf8");
    const onSelect = src.slice(src.indexOf("<ConfigurationPresets"), src.indexOf('trackEvent("configuration_preset_selected"'));
    expect(onSelect).toContain("scrollToPurchaseRef.current = preset.pendingChoices.length === 0");
    expect(onSelect).toContain("setManualExpanded(false)");
    expect(onSelect).not.toMatch(/addToCart|router\.|location|href/);
    expect(src).toContain("scrollToPurchaseRef.current = !nextSlot");
    expect(src).toContain("const target = purchaseButtonRef.current");
  });
});

describe("dealer preview PDP data", () => {
  it('reads the eleven approved Gynoid PDPs uncached after publication without broadening brand scope', () => {
    expect(gynoidApproved.products).toHaveLength(11);
    for (const product of gynoidApproved.products) {
      expect(dealerPreviewProductFetch(product.handle)).toEqual({cache: 'no-store'});
      expect(keepsWizardOpen(product.handle)).toBe(false);
    }
    expect(dealerPreviewProductFetch('gynoid-unreviewed-model')).toEqual({cache: 'reload', revalidate: 0});
  });
  it("keeps all four new Elf galleries fresh without changing their wizard behavior or other SE products", () => {
    expect(Object.keys(SE_ELF_FACTS)).toHaveLength(4);
    for (const handle of Object.keys(SE_ELF_FACTS)) {
      expect(dealerPreviewProductFetch(handle)).toEqual({cache: 'no-store'});
      expect(keepsWizardOpen(handle)).toBe(false);
    }
    expect(dealerPreviewProductFetch('sedoll-akina-157cm-h-cup-tpe-companion-doll-z7mv2'))
      .toEqual({cache: 'reload', revalidate: 0});
  });
  it("fetches FunWest/Top Fire products uncached so Shopify edits show up", () => {
    expect(dealerPreviewProductFetch("funwest-dolls-lily-157cm-g-cup-silicone-companion-doll-fsd052")).toEqual({ cache: "no-store" });
    expect(dealerPreviewProductFetch("top-fire-doll-grace-162cm-i-cup-silicone-companion-doll")).toEqual({ cache: "no-store" });
    expect(dealerPreviewProductFetch("irontech-fenny-162cm-g-cup-hybrid-companion-doll-1if4v")).toEqual({ cache: "reload", revalidate: 0 });
  });
  it("drops internal workflow tags from the public payload", () => {
    expect(dealerPublicTags(["catalog-review-hold", "custom", "dollwow-test", "full-doll"])).toEqual(["custom", "full-doll"]);
    expect(dealerPublicTags(undefined)).toBeUndefined();
  });
});
