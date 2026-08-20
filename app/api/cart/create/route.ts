import { NextResponse } from "next/server";
import { cartCreateRequestSchema } from "@/lib/cart/input";
import { serverValidateAndRepriceLine } from "@/lib/cart/server-validation";
import { createCart } from "@/lib/shopify/storefront";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  try {
    const input = cartCreateRequestSchema.parse(await request.json());
    const line = await serverValidateAndRepriceLine(input);
    const cart = await createCart({ ...line, discountCodes: input.discountCodes });
    trackServerEvent(analyticsEvents.addToCart, {
      params: {
        variant_id: input.merchandiseId,
        line_count: input.quantity
      }
    });
    trackServerEvent(analyticsEvents.beginCheckout, {
      params: {
        line_count: input.quantity
      }
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create cart." },
      { status: 400 }
    );
  }
}
