import { NextResponse } from "next/server";
import { cartCheckoutRequestSchema } from "@/lib/cart/input";
import { serverValidateAndRepriceLines } from "@/lib/cart/server-validation";
import { createCartWithLines } from "@/lib/shopify/storefront";
import { attachCheckoutAnalytics } from "@/lib/analytics/cart-context";
import { assertDol266PricePreviewReadOnly } from '@/lib/catalog/dol266PricePreview';

export async function POST(request: Request) {
  try {
    assertDol266PricePreviewReadOnly();
    const input = cartCheckoutRequestSchema.parse(await request.json());
    const lines = await serverValidateAndRepriceLines(input.lines);
    const cart = await createCartWithLines({ lines, discountCodes: input.discountCodes });
    await attachCheckoutAnalytics(cart, request);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create checkout." },
      { status: 400 }
    );
  }
}
