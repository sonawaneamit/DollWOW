import {describe, expect, it} from "vitest";
import {sampleProducts} from "@/lib/data/sample-products";
import {productPdpHeading, productPublicTitle, productSeoTitle, productTitleConfiguration, productWarehouseTitleLabel} from "@/lib/catalog/naming";
import {buildPdpMetadata} from "@/lib/catalog/pdpSeo";

const fixture = {
  ...sampleProducts[0], title: "FunWest Dolls Lily 157cm G-Cup Silicone Customizable Companion Doll",
  vendor: "FunWest Dolls", tags: [],
  extended: {brand:"FunWest Dolls",displayName:"Lily",heightCm:157,cupSize:"G",material:"Silicone",headModel:"head-036sj",stockStatus:"custom" as const,customAvailable:true}
};

describe("product identity titles",()=>{
  it("distinguishes different named dolls with identical specifications",()=>{
    expect(productPdpHeading(fixture)).toContain("FunWest Lily");
    const other={...fixture,extended:{...fixture.extended,displayName:"Bella"}};
    expect(productPdpHeading(other)).not.toBe(productPdpHeading(fixture));
  });
  it("does not truncate function suffixes from head codes",()=>{
    expect(productPdpHeading(fixture)).toContain("Head 036SJ");
    const other={...fixture,extended:{...fixture.extended,headModel:"head-036s"}};
    expect(productPdpHeading(other)).toContain("Head 036S ");
    expect(productPdpHeading(other)).not.toBe(productPdpHeading(fixture));
  });
  it("preserves compound head codes without extracting a stray number",()=>{
    expect(productSeoTitle({...fixture,extended:{...fixture.extended,headModel:"ID2H-2"}})).toContain("Head ID2H-2");
    expect(productSeoTitle({...fixture,extended:{...fixture.extended,headModel:"Ai-Tech 405 - Compact"}})).not.toContain("Head 405");
  });
  it.each([
    ["United States","US"],["United Kingdom","UK"],["Australia","Australia"],
    ["Canada","Canada"],["European Union","EU"]
  ])("keeps the %s warehouse offer identifiable",(country,label)=>{
    const rts={...fixture,extended:{...fixture.extended,stockStatus:"ready_to_ship" as const,warehouseCountry:country}};
    expect(productPdpHeading(rts)).toContain(`${label} Warehouse`);
    expect(productPdpHeading(rts)).not.toBe(productPdpHeading(fixture));
    expect(productPdpHeading(rts)).toContain("Ready-To-Ship");
  });
  it("does not infer a warehouse from a handle or claim delivery coverage",()=>{
    expect(productWarehouseTitleLabel({...fixture,handle:"example-rts-us"})).toBe("");
    expect(productWarehouseTitleLabel({...fixture,extended:{...fixture.extended,warehouseCountry:"United States"}})).toBe("");
  });
  it("normalizes equivalent warehouse aliases and stable multi-region ordering",()=>{
    const p={...fixture,extended:{...fixture.extended,stockStatus:"ready_to_ship" as const,warehouseRegions:["United States","EU","US"]}};
    expect(productWarehouseTitleLabel(p)).toBe("EU / US Warehouse");
  });
  it("retains only recognized fixed MD configuration details",()=>{
    const p={...fixture,title:"MD Doll Ann 166cm Doll (Natural skin, Implanted Brows, Neck Twist, unverified promise)",extended:{...fixture.extended,brand:"MD Doll"}};
    expect(productTitleConfiguration(p)).toBe("Natural skin, Implanted Brows, Neck Twist");
    expect(productPdpHeading(p)).not.toContain("unverified promise");
  });
  it("retains explicitly advertised Irontech functions and body generation",()=>{
    const p={...fixture,title:"Molly 166cm 2.0 E-Cup S44 ROS MAX Silicone Doll",extended:{...fixture.extended,brand:"Irontech Dolls"}};
    expect(productTitleConfiguration(p)).toBe("ROS MAX, 2.0 Body");
    expect(productTitleConfiguration({...p,title:"Molly 166cm Silicone Doll"})).toBe("");
  });
  it("repairs an audited repeated SEO title using the current identity in search and social",()=>{
    const p={...fixture,seo:{title:"FunWest Dolls Lily 157cm G-Cup Silicone",description:"Authored copy."}};
    const metadata=buildPdpMetadata(p);
    expect(metadata.title).toBe(productPdpHeading(p));
    expect(metadata.openGraph).toMatchObject({title:metadata.title});
    expect(metadata.twitter).toMatchObject({title:metadata.title});
    expect(metadata.description).toBe("Authored copy.");
  });
  it("preserves unique authored SEO copy and does not fabricate distinctions",()=>{
    const p={...fixture,seo:{title:"Lily - Ocean Studio | FunWest",description:"Original."}};
    expect(buildPdpMetadata(p).title).toBe(p.seo.title);
    expect(productPdpHeading({...fixture,handle:"different-random-suffix"})).toBe(productPdpHeading(fixture));
  });
  it("does not repeat specifications in already complete reviewed display names",()=>{
    const p={...fixture,title:"Irontech Bailey 161cm ROS MAX Silicone Doll",extended:{...fixture.extended,brand:"Irontech Dolls",displayName:"Irontech Bailey 161cm ROS MAX Silicone Doll"}};
    expect(productPdpHeading(p)).toBe("Irontech Bailey 161cm ROS MAX Silicone Doll");
  });
  it("does not append the same verified height already present in the model name", () => {
    const p = {...fixture, title:"Sophia Lane SET008 - ST2 103cm", extended:{...fixture.extended,brand:"SE Doll",displayName:"Sophia Lane SET008 - ST2 103cm",heightCm:103,cupSize:"J",headModel:"head-142so"}};
    expect(productPdpHeading(p).match(/103\s*cm/gi)).toHaveLength(1);
    expect(productPublicTitle(p).match(/103\s*cm/gi)).toHaveLength(1);
    expect(productPdpHeading(p)).toContain("SET008 - ST2");
    expect(p.extended.displayName).toBe("Sophia Lane SET008 - ST2 103cm");
    const mismatch = {...p, extended:{...p.extended,displayName:"Sophia Lane 102cm"}};
    expect(productPdpHeading(mismatch)).toContain("102cm");
    expect(productPdpHeading(mismatch)).toContain("103cm");
  });
  it("retains fractional heights only when title and measurement corroborate integer rounding",()=>{
    const p={...fixture,title:"Ellen 112.5cm Silicone Torso",extended:{...fixture.extended,heightCm:113,measurements:{Height:"3 ft 8 in / 112.5 cm"}}};
    expect(productPdpHeading(p)).toContain("112.5cm");
    expect(productPdpHeading({...p,extended:{...p.extended,measurements:{Height:"114 cm"}}})).toContain("113cm");
    expect(p.extended.heightCm).toBe(113);
  });
});
