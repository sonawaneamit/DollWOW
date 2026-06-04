import { NextResponse } from "next/server";
import { cartCreateRequestSchema } from "@/lib/cart/input";
import { createCart } from "@/lib/shopify/storefront";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  try {
    const input = cartCreateRequestSchema.parse(await request.json());
    const cart = await createCart(input);
    trackServerEvent(analyticsEvents.addToCart, {
      variant_id: input.merchandiseId,
      line_count: input.quantity
    });
    trackServerEvent(analyticsEvents.beginCheckout, {
      checkout_url: cart.checkoutUrl,
      line_count: input.quantity
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create cart." },
      { status: 400 }
    );
  }
}
