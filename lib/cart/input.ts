import { z } from "zod";
import { normalizeDiscountCodes, normalizeLineAttributes } from "@/lib/cart/attributes";

export const rawAttributeSchema = z.object({
  key: z.string().max(255),
  value: z.string().max(2000)
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
    attributes: z.array(rawAttributeSchema).max(20).optional(),
    customizationCharge: z
      .object({
        amount: z.number().positive().max(20000),
        currencyCode: z.string().trim().min(3).max(3).default("USD"),
        description: z.string().trim().min(1).max(1000).default("Custom option upgrades")
      })
      .optional(),
    discountCodes: z.array(z.string().max(120)).max(10).optional()
  })
  .transform((input) => ({
    ...input,
    attributes: normalizeLineAttributes(input.attributes),
    discountCodes: normalizeDiscountCodes(input.discountCodes)
  }));

export const cartLineSchema = z.object({
  merchandiseId: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .refine((value) => value.startsWith("gid://shopify/ProductVariant/"), "A Shopify product variant ID is required."),
  quantity: z.number().int().min(1).max(10).default(1),
  attributes: z.array(rawAttributeSchema).max(20).optional()
});

export const cartCheckoutRequestSchema = z
  .object({
    lines: z.array(cartLineSchema).min(1).max(20),
    discountCodes: z.array(z.string().max(120)).max(10).optional()
  })
  .transform((input) => ({
    lines: input.lines.map((line) => ({
      ...line,
      attributes: normalizeLineAttributes(line.attributes)
    })),
    discountCodes: normalizeDiscountCodes(input.discountCodes)
  }));

export type CartCreateRequest = z.infer<typeof cartCreateRequestSchema>;
export type CartCheckoutRequest = z.infer<typeof cartCheckoutRequestSchema>;
