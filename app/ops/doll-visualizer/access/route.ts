import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ai/rateLimit";
import { isVisualizerProduct, visualizerUrl } from "@/lib/doll-visualizer/config";
import { createVisualizerAccessToken } from "@/lib/doll-visualizer/session";
import { sendEmail } from "@/lib/email/sendEmail";
import { env } from "@/lib/utils/env";

const input = z.object({ email: z.string().email().max(180), handle: z.string().min(1).max(180) });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isVisualizerProduct(parsed.data.handle)) return NextResponse.json({ ok: true });
  const email = parsed.data.email.trim().toLowerCase();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const [emailLimit, ipLimit] = await Promise.all([
    checkRateLimit({ scope: "visualizer-access-email", identifier: email, limit: 4, windowSeconds: 60 * 60 }),
    checkRateLimit({ scope: "visualizer-access-ip", identifier: forwarded, limit: 12, windowSeconds: 60 * 60 })
  ]);
  if (!emailLimit.allowed || !ipLimit.allowed) return NextResponse.json({ ok: true });

  const token = createVisualizerAccessToken(email, parsed.data.handle);
  const url = `${env.NEXT_PUBLIC_SITE_URL}/ops/doll-visualizer/verify?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Your Doll Visualizer™ access link",
    text: `Open this private link within 15 minutes to verify your email and use Doll Visualizer™: ${url}`,
    html: `<p>Verify your email to use your five complimentary Doll Visualizer™ previews across your devices.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#bd441d;color:#fff;text-decoration:none;font-weight:700">Open Doll Visualizer™</a></p><p style="color:#685b55">This private link expires in 15 minutes.</p>`
  });
  return NextResponse.json({ ok: true });
}
