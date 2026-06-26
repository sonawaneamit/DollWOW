export type ComparisonStatus = "pending" | "parsed" | "matched" | "needs_review" | "discount_ready";
export type MatchConfidence = "high" | "medium" | "low";

export type ParsedListing = {
  inputUrl: string;
  sourceDomain: string;
  title?: string;
  description?: string;
  price?: number | null;
  salePrice?: number | null;
  currency?: string | null;
  imageUrls: string[];
  vendor?: string;
  deliveryClaim?: string;
  stockStatus?: string;
  couponCode?: string;
  couponPercent?: number;
  couponFixedAmount?: number;
  freeShipping?: boolean;
  freebies?: string[];
  promoText?: string[];
  extractionConfidence?: MatchConfidence;
  lastCheckedAt: string;
};

export type PriceMatchDecision = {
  allowed: boolean;
  reasons: string[];
  discountPercent?: number;
  expiresAt?: string;
  discountCode?: string;
  discountProviderId?: string;
};

export type ComparisonRequest = {
  id: string;
  inputUrl: string;
  customerEmail?: string;
  quotedPrice?: number;
  quotedCurrency?: string;
  requestedDiscountAmount?: number;
  screenshotUrl?: string;
  targetProductHandle?: string;
  targetProductTitle?: string;
  status: ComparisonStatus;
  adminStatus?: "new" | "in_review" | "approved" | "declined" | "sent_code";
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedDiscountAmount?: number;
  approvedDiscountCurrency?: string;
  approvedDiscountCode?: string;
  customerReplySentAt?: string;
  customerReplyKind?: "approval" | "decline";
  confidence: MatchConfidence;
  parsed: ParsedListing | null;
  matchProductId?: string;
  priceMatch: PriceMatchDecision;
  createdAt: string;
};
