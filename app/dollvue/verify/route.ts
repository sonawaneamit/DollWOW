import { NextResponse } from "next/server";
import { dollVueUrl } from "@/lib/dollvue/config";
import { resolveCurrentDollVueEligibility } from '@/lib/dollvue/eligibility';
import { getProductByHandle } from '@/lib/shopify/storefront';
import { verifyDollVueAccessToken, dollVueSessionCookie } from "@/lib/dollvue/session";
import { updateDollVueSubmission } from '@/lib/dollvue/submissions';

export async function GET(request: Request) {
  const access = verifyDollVueAccessToken(new URL(request.url).searchParams.get("token"));
  if (!access) {
    return NextResponse.redirect(new URL("/dollvue?access=invalid", request.url));
  }
  const product = await getProductByHandle(access.handle, { cache: 'no-store', strict: true }).catch(() => null);
  if (!product || !(await resolveCurrentDollVueEligibility(product, { holdTimeoutMs: 8000 })).available) {
    return NextResponse.redirect(new URL("/dollvue?access=invalid", request.url));
  }
  const response = NextResponse.redirect(new URL(dollVueUrl(access.handle), request.url));
  if (access.submissionId) await updateDollVueSubmission(access.submissionId, access.email,
    { verified_at: new Date().toISOString() }).catch(() => false);
  response.headers.set("Set-Cookie", dollVueSessionCookie(access.email));
  return response;
}
