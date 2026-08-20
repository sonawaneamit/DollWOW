import { NextResponse } from "next/server";
import { cartCheckoutRequestSchema } from "@/lib/cart/input";
import { serverValidateAndRepriceLines } from "@/lib/cart/server-validation";
import { createCartWithLines } from "@/lib/shopify/storefront";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";

export async function POST(request: Request) {
  try {
    const input = cartCheckoutRequestSchema.parse(await request.json());
    const lines = await serverValidateAndRepriceLines(input.lines);
    const cart = await createCartWithLines({ lines, discountCodes: input.discountCodes });
    const lineCount = lines.reduce((sum, line) => sum + line.quantity, 0);
    trackServerEvent(analyticsEvents.beginCheckout, {
      params: {
        line_count: lineCount,
        distinct_items: lines.length
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
