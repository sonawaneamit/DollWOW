import { NextResponse } from "next/server";
import { cartCreateRequestSchema } from "@/lib/cart/input";
import { serverValidateAndRepriceLine } from "@/lib/cart/server-validation";
import { createCart } from "@/lib/shopify/storefront";

export async function POST(request: Request) {
  try {
    const input = cartCreateRequestSchema.parse(await request.json());
    const line = await serverValidateAndRepriceLine(input);
    const cart = await createCart({ ...line, discountCodes: input.discountCodes });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create cart." },
      { status: 400 }
    );
  }
}
