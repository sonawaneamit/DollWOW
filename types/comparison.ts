export type ComparisonStatus = "pending" | "parsed" | "matched" | "needs_review" | "discount_ready";
export type MatchConfidence = "high" | "medium" | "low";

export type ParsedListing = {
  inputUrl: string;
  sourceDomain: string;
  title?: string;
  price?: number | null;
  currency?: string | null;
  imageUrls: string[];
  vendor?: string;
  deliveryClaim?: string;
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
  status: ComparisonStatus;
  confidence: MatchConfidence;
  parsed: ParsedListing | null;
  matchProductId?: string;
  priceMatch: PriceMatchDecision;
  createdAt: string;
};
