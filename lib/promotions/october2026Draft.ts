// Source facts. Unresolved paid reductions and lightweight pricing remain held.
export const OCTOBER_RELEASE_READY = false;

export type OctoberProductFacts = {
  brand: "se" | "irontech" | "real-lady" | "other";
  material: "tpe" | "silicone" | "hybrid" | "unknown";
  fulfillment: "custom" | "rts" | "unknown";
  form: "full-body" | "torso" | "head" | "unknown";
  bodyCode?: string;
  series?: string;
  skinTone?: string;
  headMaterial?: "tpe" | "silicone";
};

export const OCTOBER_CAMPAIGNS = {
  se: {
    startsOn: "2026-10-01", endsOn: "2026-10-31",
    source: "gmail:1a0e790ff947f41e",
    assetFolder: "https://drive.google.com/drive/folders/1cTJ5j_mB1LWT8aix8vCEd4pQE5DJOs63",
    cashDiscountOnOrder: false,
    releaseHolds: ["Reviewed option-price mappings", "Exact scheduling timezone", "Warehouse prices must come from current stock list, not a second percentage reduction"],
  },
  irontech: {
    startsOn: "2026-10-08", endsOn: "2026-11-08",
    source: "gmail:1a0ebf080ee034c6 + gmail:1a066315006f3158",
    assetFolder: "https://drive.google.com/drive/folders/182efwImC-x3fgpNdRK24qr5U4ETynh0J",
    cashDiscountOnOrder: false,
    releaseHolds: ["Reviewed option-price mappings", "Exact scheduling timezone"],
  },
  "real-lady": {
    startsOn: "2026-10-05", endsOn: "2026-11-05",
    source: "drive:1pW7uTMd2IomXIHy7MN77EoMRZw2y4VS9 pages 1-2",
    assetFolder: "https://drive.google.com/drive/folders/1CfnfdaIABhGQ-KqL6dzOWv9wk2hq9rhI",
    cashDiscountOnOrder: false,
    releaseHolds: ["Reviewed option-price mappings", "Exact scheduling timezone"],
  },
} as const;

export function inFactoryDateWindow(day: string, start: string, end: string) {
  // Date-only source terms; callers must not invent a UTC cutoff from these values.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const timestamp = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0,10) !== day) return false;
  return day >= start && day <= end;
}

export function octoberOfferCandidate(product: OctoberProductFacts, day: string) {
  if (product.brand === "other") return null;
  const campaign = OCTOBER_CAMPAIGNS[product.brand];
  if (!inFactoryDateWindow(day,campaign.startsOn,campaign.endsOn)) return null;
  // Warehouse and standalone-head exceptions stay separate from full-body bonuses.
  if (product.fulfillment !== "custom") return null;
  if (product.brand === "irontech") {
    if (product.material === 'silicone' && product.form === 'head') return 'irontech-head-talkx-only';
    return product.material === "silicone" && product.form === "full-body"
      ? "irontech-silicone-full-body" : null;
  }
  if (product.brand === "real-lady") {
    if (product.material !== "silicone") return null;
    if (product.form === "head") return "real-lady-head-talkx-only";
    return product.form === "full-body" ? "real-lady-silicone-full-body" : null;
  }
  if (product.material === "tpe" && product.form === "full-body") return "se-tpe-full-body";
  if (product.material !== "silicone") return null;
  if (product.form === "torso") return "se-silicone-torso";
  return product.form === "full-body" && product.series === "Silicone Pro"
    ? "se-silicone-pro-full-body" : null;
}

const lightweightBodies = new Set(["157H", "161F", "163E"]);
export function seLightweightCandidate(product: OctoberProductFacts) {
  if (product.brand !== "se" || product.material !== "tpe" || product.fulfillment !== "custom" || product.form !== "full-body") return false;
  if (!lightweightBodies.has(product.bodyCode?.toUpperCase().replace(/\s+/g, "") ?? "")) return false;
  // Factory has verified cross-material color matching only for Light Tan.
  if (product.headMaterial === "silicone" && product.skinTone !== "Light Tan") return false;
  return product.headMaterial === "tpe" || product.headMaterial === "silicone";
}

export const SE_LIGHTWEIGHT_DRAFT = {
  source: "gmail:1a0ecbc74d36b45a",
  compatibilitySource: "https://www.sedoll.com/stpe-series-introduces-a-new-custom-option-lstpe-lightweight-upgrade/",
  bodies: {"157H": {standardKg:41,lightweightKg:31},"161F":{standardKg:35,lightweightKg:31.6},"163E":{standardKg:37,lightweightKg:26}},
  supplierSurchargeUSD:80,
  suggestedMinimumRetailSurchargeUSD:100,
  octoberUpgradeDiscountPercent:10,
  chargeReady:false,
  releaseHolds:["Confirm who receives factory 10% and permitted retail minimum", "Confirm lightweight plus silicone-head combination pricing", "Validate exact product menu and named charge"],
} as const;

export const OCTOBER_OPTION_RULES = {
  seTpe: {free:["STPE upgrade","EVO skeleton","Gel breasts","Fixed tongue","Lubricant-free vagina","Realistic body painting"]},
  seSiliconePro: {
    free:["Realistic body painting","Hard hands and feet","ROS","Implanted eyebrows and eyelashes","Gel breasts","Soft vagina","Articulated fingers OR ultra-flex fingers"],
    softBellyBodyCodes:["T148","T155","T159","T165","T175"],
    percentageOptions:{masterMakeup:10,movableEyelids:30,gelButt:50,realisticSkinTexture:50},
    movableEyelidsRequires:"ROS head",
  },
  seTorso:{percentageOptions:{movableEyelids:30,gelButt:50},movableEyelidsRequires:"ROS head"},
  irontech:{
    free:["EVO skeleton","IronAI TalkX box and 60 minutes","Softer body","Second silicone head","Gel breasts and buttocks","GraceJoint fingers","Hard hands and feet","S+ makeup and body painting"],
    conditional:["Toe joints where supported"],
    freeAdditionalHeads:1,headFunctionUpgradeLimit:1,headFunctionUpgrade:"ROS or ROS MAX",
    excluded:["TPE","Hybrid","RTS pending factory clarification","Standalone heads pending October clarification"],
  },
  realLady:{
    free:["SS+ makeup","SS+ body painting","Hyper-realistic skin structure","EVO MAX skeleton","GraceJoint hand skeleton","Toe joints","Gel breasts","Hard hands","Standing feet without bolts","One sway-pivot adaptor","Second silicone head","Gel butt","IronAI TalkX box and 60 minutes"],
    freeAdditionalHeads:1,headFunctionUpgradeLimit:1,headFunctionUpgrade:"ROS or ROS MAX",
    fullBodyGifts:["Thank-you card","Lingerie","Mousepad"],giftsWhileSuppliesLast:true,
    nonFullBodyGiftMinimumExclusiveUSD:100,
    nonFullBodyGifts:["Mousepad","Thank-you card"],
    headOnlyBenefits:["IronAI TalkX box and 60 minutes"],
  },
  socialBonus:{minutes:60,automatic:false,requires:"Qualifying post about IronAI TalkX on TDF, Instagram or X tagging the official account"},
} as const;
