import type { Product } from "@/types/product";

export type EditorialIntro = NonNullable<Product["extended"]["editorialIntro"]>;

/** True only when the magazine block has paint-able eyebrow + heading + paragraph. */
export function hasEditorialIntro(value: Product["extended"]["editorialIntro"] | null | undefined): value is EditorialIntro {
  if (!value) return false;
  return Boolean(value.eyebrow?.trim() && value.heading?.trim() && value.paragraph?.trim());
}

/**
 * Strip internal sourcing language so customers only see marketing copy.
 * "Factory still", "promotional pack", and similar notes stay on Linear, not the PDP.
 */
export function cleanInternalMarketingCopy(text: string | undefined | null) {
  if (!text) return "";
  let value = text;
  value = value.replace(/\s*,?\s*factory stills?\b/gi, "");
  value = value.replace(/\s*from the (?:Fanreal )?promotional pack\b/gi, "");
  value = value.replace(/\s*\(?promotional pack\)?\b/gi, "");
  value = value.replace(/\s{2,}/g, " ");
  value = value.replace(/\s+,/g, ",");
  value = value.replace(/,\s*,/g, ",");
  value = value.replace(/\s+([.!?;:])/g, "$1");
  value = value.replace(/^[\s,;:\-]+|[\s,;:\-]+$/g, "");
  return value.trim();
}

export function customerFacingEditorialIntro(
  value: Product["extended"]["editorialIntro"] | null | undefined
): EditorialIntro | undefined {
  if (!value) return undefined;
  const next = {
    ...value,
    eyebrow: cleanInternalMarketingCopy(value.eyebrow),
    heading: cleanInternalMarketingCopy(value.heading),
    paragraph: cleanInternalMarketingCopy(value.paragraph)
  };
  return hasEditorialIntro(next) ? next : undefined;
}
