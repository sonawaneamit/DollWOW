import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  GA_MEASUREMENT_ID: z.string().optional()
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY,
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID
});

export function hasShopifyStorefrontEnv() {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

export function hasShopifyAdminEnv() {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_ADMIN_ACCESS_TOKEN);
}

export function hasSupabaseServerEnv() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}
