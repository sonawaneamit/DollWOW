import { NextResponse } from "next/server";
import { cartCheckoutRequestSchema } from "@/lib/cart/input";
import { createCartWithLines } from "@/lib/shopify/storefront";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  try {
    const input = cartCheckoutRequestSchema.parse(await request.json());
    const cart = await createCartWithLines(input);
    const lineCount = input.lines.reduce((sum, line) => sum + line.quantity, 0);
    trackServerEvent(analyticsEvents.beginCheckout, {
      params: {
        line_count: lineCount,
        distinct_items: input.lines.length
      }
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create checkout." },
      { status: 400 }
    );
  }
}
