import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Retired: the consent-aware Shopify checkout pixel is the sole GA purchase emitter. */
export async function POST() {
  return NextResponse.json({ error: "Order analytics webhook is retired." }, { status: 410 });
}
