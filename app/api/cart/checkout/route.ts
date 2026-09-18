import { NextResponse } from "next/server";
import { cartCheckoutRequestSchema } from "@/lib/cart/input";
import { serverValidateAndRepriceLines } from "@/lib/cart/server-validation";
import { createCartWithLines } from "@/lib/shopify/storefront";

export async function POST(request: Request) {
  try {
    const input = cartCheckoutRequestSchema.parse(await request.json());
    const lines = await serverValidateAndRepriceLines(input.lines);
    const cart = await createCartWithLines({ lines, discountCodes: input.discountCodes });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create checkout." },
      { status: 400 }
    );
  }
}
