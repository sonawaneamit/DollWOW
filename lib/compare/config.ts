export type ApprovedVendorConfig = {
  domain: string;
  displayName: string;
  market?: string;
  trustStatus: "owned" | "trusted" | "review";
  trustTier?: "owned" | "trusted" | "doll_forum" | "manual_review";
  allowedForPriceMatch: boolean;
  autoMatchEnabled: boolean;
  allowPromoAutoMatch: boolean;
  promoParsingMode: "owned_site_review" | "standard" | "manual_review";
  dollForumVendor?: boolean;
  notes?: string;
};

export type PriceMatchRuleConfig = {
  minGrossMargin: number;
  maxDiscountPercent: number;
  freshnessHours: number;
  expiryHours: number;
  enabled: boolean;
};

export const defaultPriceMatchRules: PriceMatchRuleConfig = {
  minGrossMargin: 0.35,
  maxDiscountPercent: 15,
  freshnessHours: 72,
  expiryHours: 48,
  enabled: true
};

export const fallbackApprovedVendors: ApprovedVendorConfig[] = [
  {
    domain: "rosemarydoll.com",
    displayName: "RosemaryDoll",
    market: "US/EU",
    trustStatus: "owned",
    trustTier: "owned",
    allowedForPriceMatch: true,
    autoMatchEnabled: true,
    allowPromoAutoMatch: false,
    promoParsingMode: "owned_site_review",
    notes: "Owned/approved source. Promo-heavy or configured-cart quotes still require team review until option-level verification is stronger."
  },
  {
    domain: "joylovedolls.com",
    displayName: "Joy Love Dolls",
    market: "US/EU",
    trustStatus: "owned",
    trustTier: "owned",
    allowedForPriceMatch: true,
    autoMatchEnabled: true,
    allowPromoAutoMatch: false,
    promoParsingMode: "owned_site_review",
    notes: "Owned/approved source. Promo-heavy or configured-cart quotes still require team review until option-level verification is stronger."
  }
];
