import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env, hasAdminBasicAuthEnv } from "@/lib/utils/env";

export function adminBasicAuthFailure(request: Request): NextResponse | undefined {
  const headers = { "Cache-Control": "private, no-store" };
  if (!hasAdminBasicAuthEnv()) {
    return NextResponse.json({ error: "Admin auth is not configured." }, { status: 503, headers });
  }

  const encoded = request.headers.get("authorization")?.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/i)?.[1];
  if (encoded) {
    try {
      const supplied = Buffer.from(atob(encoded), "latin1");
      const expected = `${env.ADMIN_BASIC_AUTH_USERNAME}:${env.ADMIN_BASIC_AUTH_PASSWORD}`;
      const digest = (value: string | Buffer) => createHash("sha256").update(value).digest();
      if (timingSafeEqual(digest(supplied), digest(expected))) return;
    } catch {
      // Malformed credentials receive the same challenge as incorrect credentials.
    }
  }

  return NextResponse.json({ error: "Unauthorized." }, {
    status: 401,
    headers: { ...headers, "WWW-Authenticate": 'Basic realm="DollWow Admin"' }
  });
}
