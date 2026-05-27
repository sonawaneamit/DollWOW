import type { Product } from "@/types/product";

const now = new Date().toISOString();

export const sampleProducts: Product[] = [
  {
    id: "gid://shopify/Product/sample-aria-156",
    handle: "aria-156-ready-to-ship",
    title: "Aria 156 Ready-To-Ship",
    description: "A compact premium doll with clear delivery timing, practical weight, and simple customization options.",
    vendor: "DollWow",
    productType: "Ready-to-ship doll",
    tags: ["ready-to-ship", "silicone", "warehouse-us", "lighter"],
    featuredImage: null,
    images: [],
    variants: [
      {
        id: "gid://shopify/ProductVariant/sample-aria-156-default",
        title: "Default",
        availableForSale: true,
        price: { amount: "2195", currencyCode: "USD" },
        selectedOptions: [{ name: "Configuration", value: "Ready-to-ship" }]
      }
    ],
    priceRange: {
      minVariantPrice: { amount: "2195", currencyCode: "USD" },
      maxVariantPrice: { amount: "2195", currencyCode: "USD" }
    },
    extended: {
      brand: "DollWow Select",
      material: "Silicone",
      heightCm: 156,
      weightLb: 67,
      cupSize: "C",
      warehouseCountry: "United States",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "5-9 business days",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Final stock is verified before checkout."
    }
  },
  {
    id: "gid://shopify/Product/sample-mira-165",
    handle: "mira-165-custom",
    title: "Mira 165 Custom",
    description: "A balanced custom build with clear option groups for material, skin tone, wig, eyes, and support add-ons.",
    vendor: "DollWow",
    productType: "Custom doll",
    tags: ["custom", "tpe", "best-value", "standard"],
    featuredImage: null,
    images: [],
    variants: [
      {
        id: "gid://shopify/ProductVariant/sample-mira-165-base",
        title: "Base custom build",
        availableForSale: true,
        price: { amount: "1685", currencyCode: "USD" },
        selectedOptions: [{ name: "Configuration", value: "Base custom build" }]
      }
    ],
    priceRange: {
      minVariantPrice: { amount: "1685", currencyCode: "USD" },
      maxVariantPrice: { amount: "1985", currencyCode: "USD" }
    },
    extended: {
      brand: "DollWow Select",
      material: "TPE",
      heightCm: 165,
      weightLb: 78,
      cupSize: "D",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "4-7 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Custom choices are confirmed before production."
    }
  },
  {
    id: "gid://shopify/Product/sample-selene-170",
    handle: "selene-170-premium-silicone",
    title: "Selene 170 Premium Silicone",
    description: "A taller premium option for buyers who want a high-end feel and are comfortable with a larger doll.",
    vendor: "DollWow",
    productType: "Premium doll",
    tags: ["silicone", "premium", "custom", "large"],
    featuredImage: null,
    images: [],
    variants: [
      {
        id: "gid://shopify/ProductVariant/sample-selene-170-base",
        title: "Premium custom build",
        availableForSale: true,
        price: { amount: "3895", currencyCode: "USD" },
        selectedOptions: [{ name: "Configuration", value: "Premium custom build" }]
      }
    ],
    priceRange: {
      minVariantPrice: { amount: "3895", currencyCode: "USD" },
      maxVariantPrice: { amount: "4395", currencyCode: "USD" }
    },
    extended: {
      brand: "DollWow Select",
      material: "Silicone",
      heightCm: 170,
      weightLb: 88,
      cupSize: "E",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "5-8 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Premium build includes pre-ship photo review where available."
    }
  },
  {
    id: "gid://shopify/Product/sample-lena-148",
    handle: "lena-148-lightweight",
    title: "Lena 148 Lightweight",
    description: "A lighter and easier-to-handle option for first-time buyers with limited space.",
    vendor: "DollWow",
    productType: "Lightweight doll",
    tags: ["ready-to-ship", "tpe", "lighter", "warehouse-eu"],
    featuredImage: null,
    images: [],
    variants: [
      {
        id: "gid://shopify/ProductVariant/sample-lena-148-default",
        title: "Default",
        availableForSale: true,
        price: { amount: "1425", currencyCode: "USD" },
        selectedOptions: [{ name: "Configuration", value: "Ready-to-ship" }]
      }
    ],
    priceRange: {
      minVariantPrice: { amount: "1425", currencyCode: "USD" },
      maxVariantPrice: { amount: "1425", currencyCode: "USD" }
    },
    extended: {
      brand: "DollWow Select",
      material: "TPE",
      heightCm: 148,
      weightLb: 55,
      cupSize: "B",
      warehouseCountry: "European Union",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "7-12 business days",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Good fit when storage and handling matter most."
    }
  }
];
