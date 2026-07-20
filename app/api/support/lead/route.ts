import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";
import { sendSupportLeadAdminAlert } from "@/lib/email/adminAlerts";
import { saveSupportLead } from "@/lib/supabase/repositories";

const schema = z.object({
  sourceFlow: z.string().min(1).max(80).default("support"),
  name: z.string().max(120).optional(),
  email: z.string().email(),
  question: z.string().min(8).max(3000),
  productIds: z.array(z.string()).optional(),
  website: z.string().max(0).optional(),
  startedAt: z.number().int().positive().optional()
});

const requestWindows = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const message =
        issue?.path[0] === "question"
          ? "Please add a little more detail so our team can help."
          : issue?.path[0] === "email"
            ? "Please enter a valid email address."
            : "Please check the form and try again.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const input = parsed.data;
    if (input.website || (input.startedAt && Date.now() - input.startedAt < 800)) {
      return NextResponse.json({ ok: true });
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientKey = forwardedFor || request.headers.get("x-real-ip") || "unknown";
    const now = Date.now();
    const recentRequests = (requestWindows.get(clientKey) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (recentRequests.length >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Too many messages were sent from this connection. Please wait a few minutes or email hello@dollwow.com." },
        { status: 429 }
      );
    }
    requestWindows.set(clientKey, [...recentRequests, now]);

    const lead = await saveSupportLead({
      sourceFlow: input.sourceFlow,
      name: input.name,
      email: input.email,
      question: input.question,
      productIds: input.productIds
    });

    const delivery = await sendSupportLeadAdminAlert({
      id: lead?.id ?? null,
      sourceFlow: input.sourceFlow,
      name: input.name,
      email: input.email,
      question: input.question
    });

    trackServerEvent(analyticsEvents.askHumanHelp, {
      params: {
        source_flow: input.sourceFlow,
        product_count: input.productIds?.length ?? 0
      }
    });

    return NextResponse.json({ ok: true, id: lead?.id ?? null, emailDelivered: delivery?.delivered ?? false });
  } catch {
    return NextResponse.json(
      { error: "We could not send your message right now. Please try again or email hello@dollwow.com." },
      { status: 500 }
    );
  }
}
