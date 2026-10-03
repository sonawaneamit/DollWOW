import {describe,it,expect} from "vitest";
import {OCTOBER_RELEASE_READY,OCTOBER_CAMPAIGNS,OCTOBER_OPTION_RULES,SE_LIGHTWEIGHT_DRAFT,inFactoryDateWindow,octoberOfferCandidate,seLightweightCandidate,type OctoberProductFacts} from "../lib/promotions/october2026Draft";

const product:OctoberProductFacts={brand:"irontech",material:"silicone",fulfillment:"custom",form:"full-body"};
describe("October supplier draft gates",()=>{
  it("cannot claim production readiness",()=>{expect(OCTOBER_RELEASE_READY).toBe(false);expect(SE_LIGHTWEIGHT_DRAFT.chargeReady).toBe(false)});
  it.each(["2026-10-07","2026-11-09","2026-02-30","invalid"])("rejects Irontech date %s",day=>expect(octoberOfferCandidate(product,day)).toBe(null));
  it.each(["2026-10-08","2026-11-08"])("includes source boundary %s",day=>expect(octoberOfferCandidate(product,day)).toBe("irontech-silicone-full-body"));
  it.each(["tpe","hybrid","unknown"] as const)("excludes Irontech %s",material=>expect(octoberOfferCandidate({...product,material},"2026-10-15")).toBe(null));
  it.each(["rts","unknown"] as const)("does not promise unverified fulfillment %s",fulfillment=>expect(octoberOfferCandidate({...product,fulfillment},"2026-10-15")).toBe(null));
  it.each(["torso","head","unknown"] as const)("does not inherit full-body benefits on %s",form=>expect(octoberOfferCandidate({...product,form},"2026-10-15")).not.toBe("irontech-silicone-full-body"));
  it("preserves Real Lady head-specific exception",()=>expect(octoberOfferCandidate({...product,brand:"real-lady",form:"head"},"2026-10-05")).toBe("real-lady-head-talkx-only"));
  it("rejects Real Lady before/after source window",()=>{for(const day of ["2026-10-04","2026-11-06"])expect(octoberOfferCandidate({...product,brand:"real-lady"},day)).toBe(null)});
  it("does not call all SE silicone products Silicone Pro",()=>expect(octoberOfferCandidate({...product,brand:"se"},"2026-10-15")).toBe(null));
  it("matches explicit SE Silicone Pro",()=>expect(octoberOfferCandidate({...product,brand:"se",series:"Silicone Pro"},"2026-10-15")).toBe("se-silicone-pro-full-body"));
  it("keeps torso rule separate",()=>expect(octoberOfferCandidate({...product,brand:"se",form:"torso"},"2026-10-15")).toBe("se-silicone-torso"));
  it.each(["157H","161F","163E"])("supports lightweight body %s",bodyCode=>expect(seLightweightCandidate({...product,brand:"se",material:"tpe",headMaterial:"tpe",bodyCode})).toBe(true));
  it.each(["157F","161H","163D","157",undefined])("rejects unsupported body %s",bodyCode=>expect(seLightweightCandidate({...product,brand:"se",material:"tpe",headMaterial:"tpe",bodyCode})).toBe(false));
  it("requires confirmed Light Tan cross-material matching",()=>{
    const p:OctoberProductFacts={...product,brand:"se",material:"tpe",headMaterial:"silicone",bodyCode:"157H"};
    expect(seLightweightCandidate(p)).toBe(false);expect(seLightweightCandidate({...p,skinTone:"Natural"})).toBe(false);expect(seLightweightCandidate({...p,skinTone:"Light Tan"})).toBe(true);
  });
  it("does not assume an unknown head is compatible",()=>expect(seLightweightCandidate({...product,brand:"se",material:"tpe",bodyCode:"157H"})).toBe(false));
  it("does not sell lightweight upgrade on ready stock",()=>expect(seLightweightCandidate({...product,brand:"se",material:"tpe",bodyCode:"157H",headMaterial:"tpe",fulfillment:"rts"})).toBe(false));
  it("does not invent an order-wide cash discount",()=>{for(const c of Object.values(OCTOBER_CAMPAIGNS))expect(c.cashDiscountOnOrder).toBe(false)});
  it("limits gifts and head upgrades",()=>{for(const c of [OCTOBER_OPTION_RULES.irontech,OCTOBER_OPTION_RULES.realLady]){expect(c.freeAdditionalHeads).toBe(1);expect(c.headFunctionUpgradeLimit).toBe(1)}expect(OCTOBER_OPTION_RULES.socialBonus.automatic).toBe(false)});
  it("keeps Real Lady quantity/threshold conditions",()=>{expect(OCTOBER_OPTION_RULES.realLady.giftsWhileSuppliesLast).toBe(true);expect(OCTOBER_OPTION_RULES.realLady.nonFullBodyGiftMinimumExclusiveUSD).toBe(100)});
  it("rejects invalid date instead of normalizing it",()=>expect(inFactoryDateWindow("2026-02-30","2026-01-01","2026-12-31")).toBe(false));
});
