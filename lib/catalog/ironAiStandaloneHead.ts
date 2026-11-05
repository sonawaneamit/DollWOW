import type { Product } from "@/types/product";

export function isReviewedIronAiHead(product: Product) {
  return product.id === "gid://shopify/Product/10518042575032" &&
    product.handle === "irontech-ironai-head-companion-doll-1v3pz";
}

export function ironAiStandPreviewEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.VERCEL_ENV === 'preview' && environment.NEXT_PUBLIC_DOL216_PREVIEW === '1';
}

function withIncludedStandPreview(product: Product): Product {
  if (!ironAiStandPreviewEnabled() || !isReviewedIronAiHead(product)) return product;
  return { ...product, extended: { ...product.extended,
    qcNote: 'A high display stand is included with every IronAI head. The optional bust-stand upgrade is $300 USD. Confirm head/body compatibility before ordering.',
    customizationGroups: product.extended.customizationGroups?.map(group => {
      if (group.id !== 'sex-doll-head-stand') return group;
      return { ...group, label: 'Display stand', required: true, selectionMode: 'single',
        description: 'A high display stand is included with every head. Choose the optional bust-stand upgrade in one skin tone for $300 USD.',
        options: group.options.filter(option => option.id !== 'no-add-on').map(option =>
          option.id === 'tall-display-stand' ? { ...option, label: 'High display stand', priceDelta: 0, priceVerified: true }
          : /^realistic-bust-stand-/.test(option.id) ? { ...option, priceDelta: 300, priceVerified: true } : option)
      };
    })
  }};
}

/** Correct the legacy read model until the reviewed Shopify record is updated. */
export function withIronAiHeadClassification(product: Product): Product {
  if (!isReviewedIronAiHead(product) || product.productType !== "Custom Adult doll doll") return withIncludedStandPreview(product);
  return withIncludedStandPreview({
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
  });
}
