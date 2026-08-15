import { NextResponse } from "next/server";
import { isDollVueProduct, dollVueUrl } from "@/lib/dollvue/config";
import { verifyDollVueAccessToken, dollVueSessionCookie } from "@/lib/dollvue/session";

export async function GET(request: Request) {
  const access = verifyDollVueAccessToken(new URL(request.url).searchParams.get("token"));
  if (!access || !isDollVueProduct(access.handle)) {
    return NextResponse.redirect(new URL("/dollvue?access=invalid", request.url));
  }
  const response = NextResponse.redirect(new URL(dollVueUrl(access.handle), request.url));
  response.headers.set("Set-Cookie", dollVueSessionCookie(access.email));
  return response;
}
