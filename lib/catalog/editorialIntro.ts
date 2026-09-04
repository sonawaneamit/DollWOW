import type { Product } from "@/types/product";

export type EditorialIntro = NonNullable<Product["extended"]["editorialIntro"]>;

/** True only when the magazine block has paint-able eyebrow + heading + paragraph. */
export function hasEditorialIntro(value: Product["extended"]["editorialIntro"] | null | undefined): value is EditorialIntro {
  if (!value) return false;
  return Boolean(value.eyebrow?.trim() && value.heading?.trim() && value.paragraph?.trim());
}
