import { NextResponse } from "next/server";
import { z } from "zod";
import { createCart } from "@/lib/shopify/storefront";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";

const schema = z.object({
  merchandiseId: z.string().min(1),
  quantity: z.number().int().min(1).max(10).default(1),
  attributes: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  discountCodes: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
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
