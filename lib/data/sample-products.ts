import type { Product } from "@/types/product";

const now = new Date().toISOString();

function image(url: string, altText: string) {
  return { url, altText, width: null, height: null };
}

function priceRange(amount: string) {
  return {
    minVariantPrice: { amount, currencyCode: "USD" },
    maxVariantPrice: { amount, currencyCode: "USD" }
  };
}

function defaultVariant(handle: string, title: string, amount: string, configuration: string): Product["variants"][number] {
  return {
    id: `gid://shopify/ProductVariant/demo-${handle}`,
    title,
    availableForSale: true,
    price: { amount, currencyCode: "USD" },
    selectedOptions: [{ name: "Configuration", value: configuration }]
  };
}

export const sampleProducts: Product[] = [
  {
    id: "gid://shopify/Product/demo-ida-belle-172",
    handle: "ida-belle-172-ready-to-ship",
    title: "Ida Belle 172cm Silicone Doll",
    description:
      "A premium Zelex build staged as a US warehouse demo item, with fast-delivery positioning and final stock verification before checkout.",
    vendor: "DollWow",
    productType: "Ready-to-ship silicone doll",
    tags: ["ready-to-ship", "silicone", "warehouse-us", "premium", "zelex"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2023/10/172cm5ft8-E-cup-Silicone-Sex-Doll-%E2%80%93-Ida-Belle-8.jpg",
      "Ida Belle 172cm silicone doll"
    ),
    images: [],
    variants: [defaultVariant("ida-belle-172", "In-stock configuration", "2000", "Ready-to-ship")],
    priceRange: priceRange("2000"),
    extended: {
      brand: "Zelex Dolls",
      material: "Silicone",
      heightCm: 172,
      weightLb: 79,
      cupSize: "E",
      warehouseCountry: "United States",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "Fast shipping from US warehouse",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Demo item sourced from the RosemaryDoll in-stock USA catalog."
    }
  },
  {
    id: "gid://shopify/Product/demo-boris-dunlop-160",
    handle: "boris-dunlop-160-ready-to-ship",
    title: "Boris Dunlop 160cm Silicone Doll",
    description:
      "A compact premium silicone option for shoppers who want US-ready availability and an easier storage footprint.",
    vendor: "DollWow",
    productType: "Ready-to-ship silicone doll",
    tags: ["ready-to-ship", "silicone", "warehouse-us", "compact", "zelex"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2023/10/160cm5ft3-J-cup-Silicone-Sex-Doll-%E2%80%93-Boris-Dunlop-10.jpg",
      "Boris Dunlop 160cm silicone doll"
    ),
    images: [],
    variants: [defaultVariant("boris-dunlop-160", "In-stock configuration", "2000", "Ready-to-ship")],
    priceRange: priceRange("2000"),
    extended: {
      brand: "Zelex Dolls",
      material: "Silicone",
      heightCm: 160,
      weightLb: 82,
      cupSize: "J",
      warehouseCountry: "United States",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "Fast shipping from US warehouse",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Final stock should be reconfirmed before enabling live checkout."
    }
  },
  {
    id: "gid://shopify/Product/demo-karen-wilcox-160",
    handle: "karen-wilcox-160-ready-to-ship",
    title: "Karen Wilcox 160cm Silicone Doll",
    description:
      "A Zelex SLE demo product for the warehouse collection, useful for showcasing quick-ship filters and product comparison cards.",
    vendor: "DollWow",
    productType: "Ready-to-ship silicone doll",
    tags: ["ready-to-ship", "silicone", "warehouse-us", "premium", "zelex"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2023/11/160cm5ft3-J-cup-Silicone-Sex-Doll-%E2%80%93-Karen-Wilcox-9.jpg",
      "Karen Wilcox 160cm silicone doll"
    ),
    images: [],
    variants: [defaultVariant("karen-wilcox-160", "In-stock configuration", "2000", "Ready-to-ship")],
    priceRange: priceRange("2000"),
    extended: {
      brand: "Zelex Dolls",
      material: "Silicone",
      heightCm: 160,
      weightLb: 82,
      cupSize: "J",
      warehouseCountry: "United States",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "Fast shipping from US warehouse",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Demo item for ready-to-ship merchandising and price-match testing."
    }
  },
  {
    id: "gid://shopify/Product/demo-cecilia-101",
    handle: "cecilia-101-ready-to-ship-torso",
    title: "Cecilia 101cm Silicone Torso",
    description:
      "A lower-ticket ready-to-ship torso demo that gives the warehouse page a compact, easier-to-handle option.",
    vendor: "DollWow",
    productType: "Ready-to-ship torso",
    tags: ["ready-to-ship", "silicone", "warehouse-us", "torso", "compact"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2025/07/106cm3ft6-F-cup-Silicone-Sex-Doll-Torso-%E2%80%93-Cecilia-20.jpg",
      "Cecilia 101cm silicone torso"
    ),
    images: [],
    variants: [defaultVariant("cecilia-101", "In-stock configuration", "1299", "Ready-to-ship")],
    priceRange: priceRange("1299"),
    extended: {
      brand: "Erovenus",
      material: "Silicone",
      heightCm: 101,
      weightLb: 60,
      cupSize: "F",
      warehouseCountry: "United States",
      stockStatus: "ready_to_ship",
      deliveryEstimate: "Fast shipping from US warehouse",
      stockLastCheckedAt: now,
      customAvailable: false,
      qcNote: "Good demo item for budget, storage, and handling filters."
    }
  },
  {
    id: "gid://shopify/Product/demo-selena-164",
    handle: "selena-164-custom",
    title: "Selena 164cm TPE Custom Doll",
    description:
      "A value-focused custom build with option groups for skin tone, styling, support add-ons, and pre-production confirmation.",
    vendor: "DollWow",
    productType: "Custom TPE doll",
    tags: ["custom", "tpe", "best-value", "factory-order", "doll-castle"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2026/05/164cm5ft5-E-cup-TPE-Sex-Doll-Selena-2.jpg",
      "Selena 164cm TPE custom doll"
    ),
    images: [],
    variants: [defaultVariant("selena-164", "Base custom build", "1599", "Custom order")],
    priceRange: priceRange("1599"),
    extended: {
      brand: "Doll Castle",
      material: "TPE",
      heightCm: 164,
      weightLb: 135,
      cupSize: "E",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "4-8 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Custom selections are confirmed before production begins."
    }
  },
  {
    id: "gid://shopify/Product/demo-zara-164",
    handle: "zara-164-custom",
    title: "Zara 164cm TPE Custom Doll",
    description:
      "A customizable Doll Castle demo product for shoppers comparing premium look, budget, and factory-order timing.",
    vendor: "DollWow",
    productType: "Custom TPE doll",
    tags: ["custom", "tpe", "best-value", "factory-order", "doll-castle"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2026/05/164cm5ft5-E-cup-TPE-Sex-Doll-Zara-2.jpg",
      "Zara 164cm TPE custom doll"
    ),
    images: [],
    variants: [defaultVariant("zara-164", "Base custom build", "1599", "Custom order")],
    priceRange: priceRange("1599"),
    extended: {
      brand: "Doll Castle",
      material: "TPE",
      heightCm: 164,
      weightLb: 135,
      cupSize: "E",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "4-8 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Useful for the Customize page and Help Me Choose recommendations."
    }
  },
  {
    id: "gid://shopify/Product/demo-rosalie-164",
    handle: "rosalie-164-silicone-head-custom",
    title: "Rosalie 164cm Silicone Head Doll",
    description:
      "A higher-spec custom demo item for shoppers who want a silicone-head build with factory personalization.",
    vendor: "DollWow",
    productType: "Custom silicone-head doll",
    tags: ["custom", "silicone-head", "premium", "factory-order", "doll-castle"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2026/05/164cm5ft5-E-cup-Silicone-Head-Sex-Doll-Rosalie-5.jpg",
      "Rosalie 164cm silicone head custom doll"
    ),
    images: [],
    variants: [defaultVariant("rosalie-164", "Premium custom build", "2299", "Custom order")],
    priceRange: priceRange("2299"),
    extended: {
      brand: "Doll Castle",
      material: "TPE body with silicone head",
      heightCm: 164,
      weightLb: 135,
      cupSize: "E",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "5-8 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Premium demo build with pre-ship confirmation where available."
    }
  },
  {
    id: "gid://shopify/Product/demo-jane-bennet-171",
    handle: "jane-bennet-171-silicone-head-custom",
    title: "Jane Bennet 171cm Silicone Head Doll",
    description:
      "A taller Starpery demo product that rounds out the custom catalog with a lighter premium build and clear production timing.",
    vendor: "DollWow",
    productType: "Custom silicone-head doll",
    tags: ["custom", "silicone-head", "premium", "factory-order", "starpery", "tall"],
    featuredImage: image(
      "https://www.rosemarydoll.com/wp-content/uploads/2026/05/171cm5ft7-D-cup-Silicone-Head-Sex-Doll-%E2%80%93-Jane-Bennet-4.jpg",
      "Jane Bennet 171cm silicone head custom doll"
    ),
    images: [],
    variants: [defaultVariant("jane-bennet-171", "Premium custom build", "1949", "Custom order")],
    priceRange: priceRange("1949"),
    extended: {
      brand: "Starpery Dolls",
      material: "TPE body with silicone head",
      heightCm: 171,
      weightLb: 79,
      cupSize: "D",
      warehouseCountry: "Factory order",
      stockStatus: "custom",
      deliveryEstimate: "5-8 weeks",
      stockLastCheckedAt: now,
      customAvailable: true,
      qcNote: "Good demo fit for taller custom recommendations."
    }
  }
];
