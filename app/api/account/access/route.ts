import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPassportOrders } from "@/lib/passport/repository";
import { createPassportAccessToken, safeAccountRedirect } from "@/lib/passport/session";
import { sendEmail } from "@/lib/email/sendEmail";
import { env } from "@/lib/utils/env";

const input = z.object({ email: z.string().email(), next: z.string().optional() });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: true });
  const next = safeAccountRedirect(parsed.data.next);
  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const previewEmails = new Set((env.PASSPORT_PREVIEW_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
  if (previewEmails.has(normalizedEmail) || await hasPassportOrders(normalizedEmail)) {
    const token = createPassportAccessToken(parsed.data.email, next);
    const url = `${env.NEXT_PUBLIC_SITE_URL}/account/access?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: parsed.data.email,
      subject: "Your secure DollWOW access link",
      text: `Use this private link within 15 minutes to access your DollWOW account: ${url}`,
      html: `<p>Use the secure button below within 15 minutes to access your DollWOW account.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#bd441d;color:#fff;text-decoration:none;font-weight:700">Open My Dolls</a></p><p style="color:#685b55">For privacy, this email does not include product or order details.</p>`
    });
  }
  return NextResponse.json({ ok: true });
}
