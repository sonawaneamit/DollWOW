import type { Product } from "@/types/product";

export function isReviewedIronAiHead(product: Product) {
  return product.id === "gid://shopify/Product/10518042575032" &&
    product.handle === "irontech-ironai-head-companion-doll-1v3pz";
}

/** Correct the legacy read model until the reviewed Shopify record is updated. */
export function withIronAiHeadClassification(product: Product): Product {
  if (!isReviewedIronAiHead(product) || product.productType !== "Custom Adult doll doll") return product;
  return {
    ...product,
    title: "Irontech IronAI Smart Head",
    productType: "Head only",
    description: "An IronAI smart head for voice and text conversations over 2.4 GHz Wi-Fi. Head only; a doll body is not included. Compatible with selected M16-connected bodies; compatibility depends on the body and head model. Some app features require a separate subscription.",
    seo: {
      title: "Irontech IronAI Smart Head - Head Only | DollWOW",
      description: "Explore the standalone Irontech IronAI smart head for voice and text interaction. Head only, no body included; selected M16 body compatibility."
    },
    tags: [...new Set([...product.tags.filter(tag => tag !== "full-doll"), "head-only"])],
    extended: {
      ...product.extended,
      displayName: "IronAI Smart Head",
      material: product.extended.material === "Adult doll" ? undefined : product.extended.material,
      heightCm: undefined,
      weightLb: undefined,
      cupSize: undefined,
      bodyType: "unknown",
      measurements: { "Head features": "Voice + text; 2.4 GHz Wi-Fi; OTA updates" },
      customizationGroups: product.extended.customizationGroups?.filter(group =>
        group.id === "head" || group.id === "sex-doll-head-stand")
    }
  };
}
