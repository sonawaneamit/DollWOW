import { NextResponse } from "next/server";
import { safeAccountRedirect, setPassportSession, verifyPassportAccessToken } from "@/lib/passport/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const access = verifyPassportAccessToken(token);
  if (!access) return NextResponse.redirect(new URL("/account/my-dolls?access=invalid", request.url));
  await setPassportSession(access.email);
  return NextResponse.redirect(new URL(safeAccountRedirect(access.redirectPath), request.url));
}
