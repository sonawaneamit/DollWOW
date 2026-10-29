import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { createDollVueAccessToken } from "@/lib/dollvue/session";
import { sendEmail } from "@/lib/email/sendEmail";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { env } from "@/lib/utils/env";
import { resolveCurrentDollVueEligibility } from "@/lib/dollvue/eligibility";
import { dollVueAccessOrigin } from "@/lib/dollvue/accessOrigin";

const input = z.object({ email: z.string().email().max(180), handle: z.string().min(1).max(180) });
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("invalid_input", "Enter a valid email address and try again.", 400);
  const email = parsed.data.email.trim().toLowerCase();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit({ scope: "dollvue-access-email", identifier: email, limit: 4, windowSeconds: 60 * 60 }),
    checkRateLimit({ scope: "dollvue-access-ip", identifier: forwarded, limit: 12, windowSeconds: 60 * 60 })
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    const resetAt = Math.max(...[emailLimit, ipLimit].filter(limit => !limit.allowed).map(limit => new Date(limit.resetAt).getTime()));
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000) || 3600);
    return failure("rate_limited", "Too many access-link requests. Please wait before trying again.", 429, retryAfter);
  }

  const product = await getProductByHandle(parsed.data.handle, { cache: 'no-store', strict: true }).catch(() => null);
  if (!product) return failure("product_unavailable", "We could not check this doll right now. Please try again shortly.", 503);
  // List/lookup flags can be false after a cold Admin timeout. Recheck the exact
  // current hold with an auth-flow budget; never turn a timeout into permission.
  const eligibility = await resolveCurrentDollVueEligibility(product, { holdTimeoutMs: 8000 }).catch(() => null);
  if (!eligibility?.available) return failure("eligibility_unavailable", "This doll cannot be verified for DollVue right now. Please try again shortly.", 503);

  let token: string;
  try { token = createDollVueAccessToken(email, parsed.data.handle); }
  catch { return failure("access_unconfigured", "Email verification is temporarily unavailable. Please try again shortly.", 503); }
  const origin = dollVueAccessOrigin(request.url, env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_ENV, process.env.VERCEL_URL);
  const url = `${origin}/dollvue/verify?token=${encodeURIComponent(token)}`;
  const delivery = await sendEmail({
    to: email,
    subject: "Your DollVue™ access link",
    text: `Open this private link within 15 minutes to verify your email and use DollVue™: ${url}`,
    html: `<p>Verify your email to use your five complimentary DollVue™ previews across your devices.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#bd441d;color:#fff;text-decoration:none;font-weight:700">Open DollVue™</a></p><p style="color:#685b55">This private link expires in 15 minutes.</p>`
  }).catch(() => null);
  if (!delivery?.delivered) return failure("send_failed", "We could not send your access link. Please try again shortly.", 503);
  console.info("DollVue access", JSON.stringify({ event: "email_accepted", provider: delivery.provider }));
  return NextResponse.json({ ok: true, status: "sent" }, { headers: { "Cache-Control": "no-store" } });
}

function failure(code: string, error: string, status: number, retryAfter?: number) {
  console.warn("DollVue access", JSON.stringify({ event: code }));
  return NextResponse.json({ ok: false, code, error }, { status, headers: {
    "Cache-Control": "no-store", ...(retryAfter ? { "Retry-After": String(retryAfter) } : {})
  } });
}
