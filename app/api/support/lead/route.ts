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
  productIds: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const lead = await saveSupportLead({
      sourceFlow: input.sourceFlow,
      name: input.name,
      email: input.email,
      question: input.question,
      productIds: input.productIds
    });

    await sendSupportLeadAdminAlert({
      id: lead?.id ?? null,
      sourceFlow: input.sourceFlow,
      name: input.name,
      email: input.email,
      question: input.question
    });

    trackServerEvent(analyticsEvents.askHumanHelp, {
      source_flow: input.sourceFlow,
      product_count: input.productIds?.length ?? 0
    });

    return NextResponse.json({ ok: true, id: lead?.id ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save support request." },
      { status: 400 }
    );
  }
}
