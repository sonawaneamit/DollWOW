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
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  extended: ProductExtended;
};

export type ProductExtended = {
  brand?: string;
  material?: string;
  heightCm?: number;
  weightLb?: number;
  cupSize?: string;
  warehouseCountry?: string;
  stockStatus?: "ready_to_ship" | "custom" | "check_stock";
  deliveryEstimate?: string;
  stockLastCheckedAt?: string;
  customAvailable?: boolean;
  qcNote?: string;
};
