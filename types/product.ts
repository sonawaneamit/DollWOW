import type { CustomizationGroup } from "./customization";

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  selectedOptions: Array<{ name: string; value: string }>;
};

export type ProductImage = {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
};

export type ProductMedia =
  | { type: "image"; image: ProductImage; altText: string | null }
  | { type: "video"; url: string; previewImage: ProductImage | null; altText: string | null };

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: ProductImage | null;
  images: ProductImage[];
  media?: ProductMedia[];
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  extended: ProductExtended;
};

export type ProductExtended = {
  catalogIdentityKey?: string;
  catalogBodyIdentityKey?: string;
  headModel?: string;
  bodyCode?: string;
  displayName?: string;
  bodyType?: "male" | "female" | "unknown";
  lookTags?: string[];
  brand?: string;
  sourceTitle?: string;
  sourceHandle?: string;
  sourceReleaseRank?: number;
  material?: string;
  heightCm?: number;
  weightLb?: number;
  cupSize?: string;
  measurements?: Record<string, string>;
  warehouseCountry?: string;
  warehouseRegions?: string[];
  stockStatus?: "ready_to_ship" | "custom" | "check_stock";
  deliveryEstimate?: string;
  stockLastCheckedAt?: string;
  customAvailable?: boolean;
  penisAddOnAvailable?: boolean;
  irontechUlwEligibility?: {
    status: "verified";
    bodyModel: string;
    source: "irontech-production-data" | "irontech-direct-confirmation";
    verifiedAt?: string;
  };
  customizationGroups?: CustomizationGroup[];
  qcNote?: string;
  editorialIntro?: {
    eyebrow: string;
    heading: string;
    paragraph: string;
    promptVersion?: string;
    generatedAt?: string;
  };
};
