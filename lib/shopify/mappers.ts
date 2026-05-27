import type { Product } from "@/types/product";

type Edge<T> = { node: T };
type Connection<T> = { edges: Array<Edge<T>> };

type ShopifyProductNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  featuredImage: Product["featuredImage"];
  images: Connection<NonNullable<Product["featuredImage"]>>;
  variants: Connection<Product["variants"][number]>;
  priceRange: Product["priceRange"];
  brand?: { value?: string };
  material?: { value?: string };
  heightCm?: { value?: string };
  weightLb?: { value?: string };
  cupSize?: { value?: string };
  warehouseCountry?: { value?: string };
  stockStatus?: { value?: string };
  deliveryEstimate?: { value?: string };
  stockLastCheckedAt?: { value?: string };
  customAvailable?: { value?: string };
  qcNote?: { value?: string };
};

function numberValue(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanValue(value?: string) {
  if (!value) return undefined;
  return ["true", "1", "yes"].includes(value.toLowerCase());
}

export function mapShopifyProduct(node: ShopifyProductNode): Product {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    vendor: node.vendor,
    productType: node.productType,
    tags: node.tags ?? [],
    featuredImage: node.featuredImage ?? null,
    images: node.images?.edges.map((edge) => edge.node) ?? [],
    variants: node.variants?.edges.map((edge) => edge.node) ?? [],
    priceRange: node.priceRange,
    extended: {
      brand: node.brand?.value ?? node.vendor,
      material: node.material?.value,
      heightCm: numberValue(node.heightCm?.value),
      weightLb: numberValue(node.weightLb?.value),
      cupSize: node.cupSize?.value,
      warehouseCountry: node.warehouseCountry?.value,
      stockStatus: node.stockStatus?.value as Product["extended"]["stockStatus"],
      deliveryEstimate: node.deliveryEstimate?.value,
      stockLastCheckedAt: node.stockLastCheckedAt?.value,
      customAvailable: booleanValue(node.customAvailable?.value),
      qcNote: node.qcNote?.value
    }
  };
}
