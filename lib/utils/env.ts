import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_APP_URL: z.string().url().optional(),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS: z.string().optional(),
  SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY: z.string().optional(),
  SHOPIFY_CLIENT_ID: z.string().optional(),
  SHOPIFY_CLIENT_SECRET: z.string().optional(),
  SHOPIFY_APP_AUTOMATION_TOKEN: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_VISUAL_SEARCH_MODEL: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_EMAIL_API_TOKEN: z.string().optional(),
  ADMIN_ALERT_EMAIL: z.string().email().optional(),
  ADMIN_ALERT_FROM: z.string().email().optional(),
  ADMIN_BASIC_AUTH_USERNAME: z.string().optional(),
  ADMIN_BASIC_AUTH_PASSWORD: z.string().optional(),
  GA_MEASUREMENT_ID: z.string().optional(),
  APIFY_API_TOKEN: z.string().optional(),
  APIFY_WEB_SCRAPER_ACTOR_ID: z.string().optional(),
  APIFY_GOOGLE_LENS_ACTOR_ID: z.string().optional()
});

export const env = envSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_APP_URL: process.env.ADMIN_APP_URL,
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS: process.env.SHOPIFY_CUSTOM_OPTION_CHARGE_VARIANTS,
  SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY: process.env.SHOPIFY_CUSTOM_OPTION_CHARGE_CURRENCY,
  SHOPIFY_CLIENT_ID: process.env.SHOPIFY_CLIENT_ID,
  SHOPIFY_CLIENT_SECRET: process.env.SHOPIFY_CLIENT_SECRET,
  SHOPIFY_APP_AUTOMATION_TOKEN: process.env.SHOPIFY_APP_AUTOMATION_TOKEN,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_VISUAL_SEARCH_MODEL: process.env.OPENAI_VISUAL_SEARCH_MODEL,
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_EMAIL_API_TOKEN: process.env.CLOUDFLARE_EMAIL_API_TOKEN,
  ADMIN_ALERT_EMAIL: process.env.ADMIN_ALERT_EMAIL,
  ADMIN_ALERT_FROM: process.env.ADMIN_ALERT_FROM,
  ADMIN_BASIC_AUTH_USERNAME: process.env.ADMIN_BASIC_AUTH_USERNAME,
  ADMIN_BASIC_AUTH_PASSWORD: process.env.ADMIN_BASIC_AUTH_PASSWORD,
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
  APIFY_API_TOKEN: process.env.APIFY_API_TOKEN,
  APIFY_WEB_SCRAPER_ACTOR_ID: process.env.APIFY_WEB_SCRAPER_ACTOR_ID,
  APIFY_GOOGLE_LENS_ACTOR_ID: process.env.APIFY_GOOGLE_LENS_ACTOR_ID
});

export function hasShopifyStorefrontEnv() {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}

export function hasShopifyAdminEnv() {
  return Boolean(env.SHOPIFY_STORE_DOMAIN && (env.SHOPIFY_ADMIN_ACCESS_TOKEN || (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET)));
}

export function hasSupabaseServerEnv() {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasAdminBasicAuthEnv() {
  return Boolean(env.ADMIN_BASIC_AUTH_USERNAME && env.ADMIN_BASIC_AUTH_PASSWORD);
}
