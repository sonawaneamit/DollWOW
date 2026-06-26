export type VisualSearchMode = "customer_lookup" | "import_review";

export type VisualSearchStatus = "new" | "processed" | "needs_review" | "provider_unavailable" | "error";

export type VisualSearchResult = {
  rank: number;
  resultUrl: string;
  resultDomain: string;
  title?: string;
  snippet?: string;
  imageUrl?: string;
  confidence?: number;
  rawResult: Record<string, unknown>;
};

export type VisualSearchCatalogSuggestion = {
  productId: string;
  handle: string;
  title: string;
  brand?: string;
  score: number;
  imageUrl?: string;
};

export type VisualSearchRequestRecord = {
  id: string;
  imageUrl: string;
  customerEmail?: string;
  mode: VisualSearchMode;
  status: VisualSearchStatus;
  notes?: string;
  results: VisualSearchResult[];
  catalogSuggestions: VisualSearchCatalogSuggestion[];
  createdAt: string;
};
