import type { Product } from "@/types/product";

export type CatalogBodyType = "male" | "female" | "unknown";

export function productBodyType(product: Product): CatalogBodyType {
  if (product.extended.bodyType === "male" || product.extended.bodyType === "female") {
    return product.extended.bodyType;
  }

  if (product.tags.includes("male-doll")) return "male";
  if (product.tags.includes("female-doll")) return "female";

  const text = `${product.title} ${product.vendor} ${product.productType} ${product.extended.brand ?? ""} ${product.tags.join(" ")}`.toLowerCase();

  if (/\b(male|man|men|masculine|torso)\b/.test(text)) return "male";
  if (/\b(female|woman|women|feminine)\b/.test(text)) return "female";

  return "unknown";
}

export function productBuilderHeading(product: Product) {
  const bodyType = productBodyType(product);
  if (bodyType === "male") return "Make him yours";
  if (bodyType === "female") return "Make her yours";
  return "Make it yours";
}

export function productCustomizeLabel(product: Product) {
  const bodyType = productBodyType(product);
  if (bodyType === "male") return "Customize him";
  if (bodyType === "female") return "Customize her";
  return "Customize this build";
}

export function productBodyLabel(product: Product) {
  const bodyType = productBodyType(product);
  if (bodyType === "male") return "male body";
  if (bodyType === "female") return "female body";
  return "body profile";
}

export function productBodyPossessive(product: Product) {
  const bodyType = productBodyType(product);
  if (bodyType === "male") return "his";
  if (bodyType === "female") return "her";
  return "its";
}
