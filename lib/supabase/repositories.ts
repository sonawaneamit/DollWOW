import { getSupabaseServerClient } from "@/lib/supabase/client";
import type { ComparisonRequest } from "@/types/comparison";
import type { QuizAnswers } from "@/types/quiz";

async function localStore() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), ".local-data");
  const file = path.join(dir, "store.json");

  async function read() {
    try {
      return JSON.parse(await fs.readFile(file, "utf8")) as {
        comparisons: Record<string, ComparisonRequest>;
        quizSessions: Record<string, { answers: QuizAnswers; recommendedProductIds: string[]; createdAt: string }>;
      };
    } catch {
      return { comparisons: {}, quizSessions: {} };
    }
  }

  async function write(data: Awaited<ReturnType<typeof read>>) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
  }

  return { read, write };
}

const memory = {
  comparisons: new Map<string, ComparisonRequest>(),
  quizSessions: new Map<string, { answers: QuizAnswers; recommendedProductIds: string[]; createdAt: string }>()
};

export async function saveComparisonRequest(request: ComparisonRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    memory.comparisons.set(request.id, request);
    const store = await localStore();
    const data = await store.read();
    data.comparisons[request.id] = request;
    await store.write(data);
    return request;
  }

  await supabase.from("comparison_requests").insert({
    id: request.id,
    input_url: request.inputUrl,
    customer_email_optional: request.customerEmail ?? null,
    status: request.status,
    confidence: request.confidence,
    result_json: request,
    parsed_title: request.parsed?.title ?? null,
    parsed_price: request.parsed?.price ?? null,
    parsed_vendor: request.parsed?.vendor ?? request.parsed?.sourceDomain ?? null
  });

  return request;
}

export async function getComparisonRequest(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const memoryRequest = memory.comparisons.get(id);
    if (memoryRequest) return memoryRequest;
    const store = await localStore();
    const data = await store.read();
    return data.comparisons[id] ?? null;
  }

  const { data } = await supabase
    .from("comparison_requests")
    .select("result_json")
    .eq("id", id)
    .maybeSingle();

  return (data?.result_json as ComparisonRequest | undefined) ?? null;
}

export async function saveGuidedSession(input: {
  id: string;
  answers: QuizAnswers;
  recommendedProductIds: string[];
  email?: string;
}) {
  const createdAt = new Date().toISOString();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    memory.quizSessions.set(input.id, {
      answers: input.answers,
      recommendedProductIds: input.recommendedProductIds,
      createdAt
    });
    const store = await localStore();
    const data = await store.read();
    data.quizSessions[input.id] = {
      answers: input.answers,
      recommendedProductIds: input.recommendedProductIds,
      createdAt
    };
    await store.write(data);
    return;
  }

  await supabase.from("guided_sessions").insert({
    id: input.id,
    answers_json: input.answers,
    recommended_product_ids: input.recommendedProductIds,
    email_optional: input.email ?? null,
    consent_flags: {},
    created_at: createdAt
  });
}

export async function saveSupportLead(input: {
  sourceFlow: string;
  email: string;
  question: string;
  productIds?: string[];
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { id: crypto.randomUUID(), ...input };

  const { data } = await supabase
    .from("support_leads")
    .insert({
      source_flow: input.sourceFlow,
      email: input.email,
      question: input.question,
      product_ids: input.productIds ?? [],
      status: "new"
    })
    .select("id")
    .single();

  return data;
}
