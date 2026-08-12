import { NextResponse } from "next/server";
import { isVisualizerProduct, visualizerUrl } from "@/lib/doll-visualizer/config";
import { verifyVisualizerAccessToken, visualizerSessionCookie } from "@/lib/doll-visualizer/session";

export async function GET(request: Request) {
  const access = verifyVisualizerAccessToken(new URL(request.url).searchParams.get("token"));
  if (!access || !isVisualizerProduct(access.handle)) {
    return NextResponse.redirect(new URL("/ops/doll-visualizer?access=invalid", request.url));
  }
  const response = NextResponse.redirect(new URL(visualizerUrl(access.handle), request.url));
  response.headers.set("Set-Cookie", visualizerSessionCookie(access.email));
  return response;
}
