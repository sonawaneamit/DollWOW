import { describe, expect, it } from "vitest";
import { configurationPresets, matchesConfigurationPreset } from "@/lib/customization/presets";
import type { BrandCustomizationConfig } from "@/types/customization";

const handle = "sedoll-lita-b-163cm-c-cup-silicone-companion-doll-1fl7h";
const body = "premium-head-body-options-multiple";
function config(): BrandCustomizationConfig {
  return { id: "test", brandLabel: "SE", leadTimeNote: "", rules: [], groups: [
    { id: "skin", label: "Skin", required: true, display: "swatches", options: [{id:"natural",label:"Natural",priceDelta:0},{id:"tan",label:"Tan",priceDelta:0}] },
    { id: body, label: "Features", display: "cards", selectionMode: "multiple", options: [
      {id:"no-add-on",label:"No add-on",priceDelta:0},
      ...["loose-joint-system-free","implanted-eyebrow-eyelash-free","ultra-soft-vagina-free","articulated-fingers-free","ultra-flex-fingers","real-skin-texture","movable-eyelids","articulated-toes"].map(id=>({id,label:id,priceDelta:10}))
    ] },
    { id: "accessories", label: "Care", display: "cards", selectionMode:"multiple", options:[
      {id:"no-add-on",label:"No add-on",priceDelta:0},
      ...["vaginal-irrigator","reusable-drying-rod","head-stand-holder"].map(id=>({id,label:id,priceDelta:20}))
    ] }
  ] };
}
describe("configuration preset pilot", () => {
  it("preserves appearance and resolves each total from the current prices", () => {
    const tiers = configurationPresets(handle, config(), 2000, { skin:"tan" });
    expect(tiers.map(p=>p.totalPrice)).toEqual([2030,2080,2130]);
    expect(tiers.every(p=>p.selections.skin === "tan")).toBe(true);
    expect(tiers[2].selections[body]).not.toContain("articulated-fingers-free");
    expect(tiers.every((preset) => !preset.highlights.includes("No add-on"))).toBe(true);
  });
  it("only exposes the explicitly selected pilot products", () => {
    expect(configurationPresets("other-se-doll", config(), 2000, {})).toEqual([]);
  });
  it.each(["missing", "unverified", "unavailable", "duplicate"])("hides tiers when an option is %s", reason => {
    const c = config(); const options=c.groups[1].options; const option=options.find(o=>o.id==="real-skin-texture")!;
    if(reason==="missing") c.groups[1].options=options.filter(o=>o!==option);
    if(reason==="unverified") option.priceVerified=false;
    if(reason==="unavailable") option.purchasable=false;
    if(reason==="duplicate") options.push({...option});
    expect(configurationPresets(handle,c,2000,{})).toEqual([]);
  });
  it("hides tiers that violate a product compatibility rule", () => {
    const c=config(); c.rules.push({id:"test",type:"incompatible",when:{groupId:body,optionId:"real-skin-texture"},conflictsWith:{groupId:body,optionId:"movable-eyelids"},message:"Incompatible"});
    expect(configurationPresets(handle,c,2000,{})).toEqual([]);
  });
  it("marks changed feature selections as customized", () => {
    const preset=configurationPresets(handle,config(),2000,{})[1];
    expect(matchesConfigurationPreset(preset,preset.selections)).toBe(true);
    expect(matchesConfigurationPreset(preset,{...preset.selections,accessories:["no-add-on"]})).toBe(false);
  });
});
