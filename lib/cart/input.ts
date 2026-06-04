import { z } from "zod";

const MAX_ATTRIBUTES = 20;
const MAX_DISCOUNT_CODES = 5;

const rawAttributeSchema = z.object({
  key: z.string().min(1).max(120),
  value: z.string().max(1000)
});

export const cartCreateRequestSchema = z
  .object({
    merchandiseId: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .refine((value) => value.startsWith("gid://shopify/ProductVariant/"), "A Shopify product variant ID is required."),
    quantity: z.number().int().min(1).max(10).default(1),
    attributes: z.array(rawAttributeSchema).max(50).optional(),
    discountCodes: z.array(z.string().max(120)).max(10).optional()
  })
  .transform((input) => ({
    ...input,
    attributes: normalizeLineAttributes(input.attributes),
    discountCodes: normalizeDiscountCodes(input.discountCodes)
  }));

export type CartCreateRequest = z.infer<typeof cartCreateRequestSchema>;

export function normalizeLineAttributes(attributes: Array<{ key: string; value: string }> = []) {
  const seen = new Set<string>();
  const normalized = [];

  for (const attribute of attributes) {
    const key = normalizeWhitespace(attribute.key).slice(0, 80);
    const value = normalizeWhitespace(attribute.value).slice(0, 500);
    const dedupeKey = key.toLowerCase();
    if (!key || !value || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({ key, value });
    if (normalized.length >= MAX_ATTRIBUTES) break;
  }

  return normalized;
}

export function normalizeDiscountCodes(discountCodes: string[] = []) {
  const seen = new Set<string>();
  const normalized = [];

  for (const code of discountCodes) {
    const value = normalizeWhitespace(code).toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 64);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
    if (normalized.length >= MAX_DISCOUNT_CODES) break;
  }

  return normalized;
}

function normalizeWhitespace(value: string) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
