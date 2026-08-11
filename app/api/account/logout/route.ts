import { NextResponse } from "next/server";
import { clearPassportSession } from "@/lib/passport/session";
export async function POST(request: Request) {
  await clearPassportSession();
  return NextResponse.redirect(new URL("/account/my-dolls", request.url), 303);
}
