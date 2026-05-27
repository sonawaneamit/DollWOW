import { NextResponse } from "next/server";
import { z } from "zod";
import { analyticsEvents, trackServerEvent } from "@/lib/analytics/events";
import { recommendProducts } from "@/lib/quiz/recommendProducts";
import { getProducts } from "@/lib/shopify/storefront";
import { saveGuidedSession } from "@/lib/supabase/repositories";
import type { QuizAnswers } from "@/types/quiz";

const answerSchema = z.object({
  budget: z.enum(["under-1500", "1500-2500", "2500-4000", "4000-plus"]),
  delivery: z.enum(["fast", "balanced", "custom"]),
  material: z.enum(["tpe", "silicone", "either"]),
  bodyType: z.enum(["lighter", "curvy", "premium", "unsure"]),
  sizeComfort: z.enum(["easy", "standard", "large"]),
  storage: z.enum(["limited", "normal", "dedicated"]),
  customNeeds: z.enum(["ready", "some-options", "full-custom"]),
  experience: z.enum(["first-time", "collector"])
});

const schema = z.object({
  answers: answerSchema,
  email: z.string().email().optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const products = await getProducts();
    const recommendations = recommendProducts(products, input.answers as QuizAnswers);
    const productIds = recommendations.map((item) => item.productId);
    const id = crypto.randomUUID();
    await saveGuidedSession({ id, answers: input.answers as QuizAnswers, recommendedProductIds: productIds, email: input.email });
    trackServerEvent(analyticsEvents.completeHelpMeChoose, {
      budget_range: input.answers.budget,
      delivery_preference: input.answers.delivery,
      recommended_count: productIds.length
    });
    return NextResponse.json({ id, productIds, recommendations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save quiz." },
      { status: 400 }
    );
  }
}
