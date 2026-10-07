import { describe, expect, it } from "vitest";
import { buildDollVuePrompt, resolveDollVueSelections, dollVueConfigForProduct, dollVueGroups, areDollVueSelectionsValid } from "@/lib/dollvue/config";
import type { BrandCustomizationConfig } from "@/types/customization";
import type { Product } from "@/types/product";
import { dollVuePhotoPosition } from '@/lib/dollvue/public';

const config: BrandCustomizationConfig = {
  id: "pilot",
  brandLabel: "Pilot",
  leadTimeNote: "",
  rules: [],
  groups: [
    { id: "skin-tone", label: "Skin Tone", display: "swatches", options: [
      { id: "tan", label: "Tan", dollVueEnabled: true, swatch: { kind: "image", value: "/option-assets/tan.jpg" } },
      { id: "unsupported", label: "Unsupported", swatch: { kind: "color", value: "#fff" } }
    ] },
    { id: "body-heating", label: "Heating", display: "cards", options: [{ id: "yes", label: "Heating" }] },
    { id: "premium-head-options", label: "Premium", display: "swatches", options: [
      { id: "add-moles-freckles", label: "Add Moles & Freckles", dollVueEnabled: true, swatch: { kind: "image", value: "/option-assets/freckles.jpg" } }
    ] }
  ]
};

const product = {
  title: "Pilot doll",
  extended: { displayName: "Vivian" }
} as Product;

describe("DollVue™ option safety", () => {
  it('restores only a still-approved source photo', () => {
    expect(dollVuePhotoPosition([{ position: 1 }, { position: 4 }], 4)).toBe(4);
    expect(dollVuePhotoPosition([{ position: 1 }, { position: 4 }], 6)).toBe(1);
    expect(dollVuePhotoPosition([{ position: 1 }])).toBe(1);
  });
  it('requires every requested selection to be valid, with one or two changes', () => {
    const a={groupId:'skin-tone',optionId:'tan'};
    const b={groupId:'premium-head-options',optionId:'add-moles-freckles'};
    expect(areDollVueSelectionsValid(config,[a])).toBe(true);
    expect(areDollVueSelectionsValid(config,[a,b])).toBe(true);
    expect(areDollVueSelectionsValid(config,[])).toBe(false);
    expect(areDollVueSelectionsValid(config,[a,a])).toBe(false);
    expect(areDollVueSelectionsValid(config,[a,{groupId:'unknown',optionId:'unknown'}])).toBe(false);
    expect(areDollVueSelectionsValid(config,[a,b,a])).toBe(false);
    const conflict={...config,rules:[{id:'conflict',type:'incompatible' as const,when:a,conflictsWith:b,message:'Conflict'}]};
    expect(areDollVueSelectionsValid(conflict,[a,b])).toBe(false);
  });
  it('does not guess a missing parent configuration for conditional choices', () => {
    const conditional={...config,groups:config.groups.map(g=>({...g,visibleWhen:[[{groupId:'head',optionId:'special'}]]}))};
    expect(areDollVueSelectionsValid(conditional,[{groupId:'skin-tone',optionId:'tan'}])).toBe(false);
  });
  it('uses label meaning, not a supplier UUID, for editing instructions', () => {
    const configWithUuid = {...config,groups:[{...config.groups[0],id:'f4b6-uuid',label:'Eye Color',options:[
      {id:'05',label:'No.5',dollVueEnabled:true,swatch:{kind:'image' as const,value:'/option-assets/5.jpg'}}
    ]}]};
    const selected = resolveDollVueSelections(configWithUuid,[{groupId:'f4b6-uuid',optionId:'05'}]);
    expect(buildDollVuePrompt(product,selected)).toContain('the visible iris color only');
    expect(buildDollVuePrompt(product,selected)).not.toContain('finishing-detail');
  });
  it("keeps supplier visual references even when checkout pricing is not verified", () => {
    const supplierGroup = {
      id: "eye-color",
      label: "Eye color",
      display: "swatches" as const,
      options: [{ id: "blue", label: "Blue", swatch: { kind: "image" as const, value: "https://supplier.test/blue.jpg" } }]
    };
    const productWithSupplierGroups = { ...product, extended: { ...product.extended, customizationGroups: [supplierGroup] } };
    const resolved = dollVueConfigForProduct(productWithSupplierGroups, config);
    expect(resolved).toBe(config);
  });

  it("exposes only visual supplier references and freckles", () => {
    expect(dollVueGroups(config).map((group) => group.id)).toEqual(["skin-tone", "premium-head-options"]);
    expect(dollVueGroups(config)[0].options.map((option) => option.id)).toEqual(["tan"]);
  });

  it("drops unknown and non-visual selections", () => {
    expect(resolveDollVueSelections(config, [
      { groupId: "skin-tone", optionId: "tan" },
      { groupId: "body-heating", optionId: "yes" },
      { groupId: "skin-tone", optionId: "not-real" }
    ])).toHaveLength(1);
  });

  it("builds an identity-preserving prompt without customer free text", () => {
    const selections = resolveDollVueSelections(config, [{ groupId: "skin-tone", optionId: "tan" }]);
    const prompt = buildDollVuePrompt(product, selections);
    expect(prompt).toContain("SKIN TONE: Tan");
    expect(prompt).toContain("Image 2: Skin Tone reference only");
    expect(prompt).toContain("Do not change anatomy");
    expect(prompt).toContain("DO NOT ADD OR INVENT ANYTHING");
    expect(prompt).toContain("exact original geometry, boundaries, scale, placement, and proportions");
    expect(prompt).toContain("same exact adult-proportioned DollWOW catalog doll");
    expect(prompt).toContain("Keep every unselected attribute unchanged");
    expect(prompt).toContain("Adapt it naturally to Image 1's original product");
  });

  it("locks all unselected product attributes without adding area-specific prompt logic", () => {
    const selections = resolveDollVueSelections(config, [{ groupId: "premium-head-options", optionId: "add-moles-freckles" }]);
    const prompt = buildDollVuePrompt(product, selections);
    expect(prompt).toContain("Apply only this named selected attribute");
    expect(prompt).toContain("Verify no unselected attribute changed");
    expect(prompt).not.toContain("SKIN-TONE AUTHORITY");
  });

});
