import { NextResponse } from "next/server";
import { rankUpsells, toUpsellSnapshot } from "@/lib/cart/upsell";
import { getProducts } from "@/lib/shopify/storefront";

export const revalidate = 300;

export async function GET() {
  const products = await getProducts({ first: 96 });
  const upsells = rankUpsells(products, 10)
    .map(toUpsellSnapshot)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  return NextResponse.json({ upsells });
}
