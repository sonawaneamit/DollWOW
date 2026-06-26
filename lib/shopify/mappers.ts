import type { Product } from "@/types/product";
import type { CustomizationGroup } from "@/types/customization";

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
  catalogIdentityKey?: { value?: string };
  catalogBodyIdentityKey?: { value?: string };
  headModel?: { value?: string };
  displayName?: { value?: string };
  bodyType?: { value?: string };
  brand?: { value?: string };
  sourceTitle?: { value?: string };
  sourceHandle?: { value?: string };
  material?: { value?: string };
  heightCm?: { value?: string };
  weightLb?: { value?: string };
  cupSize?: { value?: string };
  measurements?: { value?: string };
  warehouseCountry?: { value?: string };
  stockStatus?: { value?: string };
  deliveryEstimate?: { value?: string };
  stockLastCheckedAt?: { value?: string };
  customAvailable?: { value?: string };
  customizationGroups?: { value?: string };
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

function jsonValue<T>(value?: string): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function normalizeImportedAssetUrl(value: string) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    if (pathname.includes("deluxe-care-kit")) {
      return "/option-swatches/deluxe-care-kit.svg";
    }

    if (pathname.includes("care-kit")) {
      return "/option-swatches/care-kit.svg";
    }

    if (url.hostname.includes("nitrocdn.com")) {
      const match = url.pathname.match(/\/(www\.)?(supplier|rosemarydoll)\.com(\/wp-content\/uploads\/.+)$/i);
      if (match) {
        return `https://www.rosemarydoll.com${match[3]}`;
      }
    }

    if (/(^|\.)supplier\.com$/i.test(url.hostname)) {
      url.hostname = "www.rosemarydoll.com";
      return url.toString();
    }

    if (url.hostname === "rosemarydoll.com") {
      url.hostname = "www.rosemarydoll.com";
      return url.toString();
    }

    return value;
  } catch {
    return value;
  }
}

function normalizeCustomizationGroups(groups: Product["extended"]["customizationGroups"] | undefined): CustomizationGroup[] | undefined {
  if (!groups?.length) return groups;

  return groups.map((group) => ({
    ...group,
    options: (group.options || []).map((option) => ({
      ...option,
      swatch:
        option.swatch?.kind === "image" && option.swatch.value
          ? {
              ...option.swatch,
              value: normalizeImportedAssetUrl(option.swatch.value)
            }
          : option.swatch
    }))
  }));
}

export function mapShopifyProduct(node: ShopifyProductNode): Product {
  const customizationGroups = normalizeCustomizationGroups(
    jsonValue<Product["extended"]["customizationGroups"]>(node.customizationGroups?.value)
  );

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
      catalogIdentityKey: node.catalogIdentityKey?.value,
      catalogBodyIdentityKey: node.catalogBodyIdentityKey?.value,
      headModel: node.headModel?.value,
      displayName: node.displayName?.value,
      bodyType: (node.bodyType?.value as Product["extended"]["bodyType"]) || undefined,
      brand: node.brand?.value ?? node.vendor,
      sourceTitle: node.sourceTitle?.value,
      sourceHandle: node.sourceHandle?.value,
      material: node.material?.value,
      heightCm: numberValue(node.heightCm?.value),
      weightLb: numberValue(node.weightLb?.value),
      cupSize: node.cupSize?.value,
      measurements: jsonValue<Record<string, string>>(node.measurements?.value),
      warehouseCountry: node.warehouseCountry?.value,
      stockStatus: node.stockStatus?.value as Product["extended"]["stockStatus"],
      deliveryEstimate: node.deliveryEstimate?.value,
      stockLastCheckedAt: node.stockLastCheckedAt?.value,
      customAvailable: booleanValue(node.customAvailable?.value),
      customizationGroups,
      qcNote: node.qcNote?.value
    }
  };
}
