import { NextResponse, type NextRequest } from "next/server";
import { env, hasAdminBasicAuthEnv } from "@/lib/utils/env";

export function proxy(request: NextRequest) {
  if (
    !request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/ops") &&
    !request.nextUrl.pathname.startsWith("/price-match")
  ) {
    return NextResponse.next();
  }

  if (!hasAdminBasicAuthEnv()) {
    return new NextResponse("Admin auth is not configured.", { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = atob(auth.slice(6));
  const [username, password] = decoded.split(":");

  if (username !== env.ADMIN_BASIC_AUTH_USERNAME || password !== env.ADMIN_BASIC_AUTH_PASSWORD) {
    return unauthorized();
  }

  return NextResponse.next();
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DollWow Admin"'
    }
  });
}

export const config = {
  matcher: ["/admin/:path*", "/ops/:path*", "/price-match/:path*"]
};
