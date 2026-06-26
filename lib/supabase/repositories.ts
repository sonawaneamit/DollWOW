import { getSupabaseServerClient } from "@/lib/supabase/client";
import { defaultPriceMatchRules, fallbackApprovedVendors, type ApprovedVendorConfig, type PriceMatchRuleConfig } from "@/lib/compare/config";
import type { ComparisonRequest } from "@/types/comparison";
import type { QuizAnswers } from "@/types/quiz";
import type { VisualSearchRequestRecord } from "@/types/visualSearch";

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
        visualSearchRequests: Record<string, VisualSearchRequestRecord>;
      };
    } catch {
      return { comparisons: {}, quizSessions: {}, visualSearchRequests: {} };
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
  quizSessions: new Map<string, { answers: QuizAnswers; recommendedProductIds: string[]; createdAt: string }>(),
  visualSearchRequests: new Map<string, VisualSearchRequestRecord>()
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

  const { error: comparisonError } = await supabase.from("comparison_requests").insert({
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
  if (comparisonError) {
    throw new Error(`Could not save comparison request: ${comparisonError.message}`);
  }

  if (request.parsed) {
    const { error: sourceError } = await supabase.from("comparison_sources").insert({
      request_id: request.id,
      source_url: request.parsed.inputUrl,
      title: request.parsed.title ?? null,
      price: request.parsed.salePrice ?? request.parsed.price ?? null,
      vendor: request.parsed.vendor ?? request.parsed.sourceDomain,
      delivery_claim: request.parsed.deliveryClaim ?? null,
      match_notes: [
        request.parsed.stockStatus ? `Stock: ${request.parsed.stockStatus}` : "",
        request.parsed.couponCode ? `Coupon code: ${request.parsed.couponCode}` : "",
        request.parsed.couponPercent ? `Coupon: ${request.parsed.couponPercent}% off` : "",
        request.parsed.couponFixedAmount ? `Coupon: $${request.parsed.couponFixedAmount} off` : "",
        request.parsed.freeShipping ? "Free shipping mentioned" : "",
        request.parsed.freebies?.length ? `Freebies: ${request.parsed.freebies.join("; ")}` : "",
        request.parsed.promoText?.length ? `Promo text: ${request.parsed.promoText.join(" | ")}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    });
    if (sourceError) {
      throw new Error(`Could not save comparison source details: ${sourceError.message}`);
    }
  }

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

  const { data, error } = await supabase
    .from("comparison_requests")
    .select("result_json")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load comparison request: ${error.message}`);
  }

  return (data?.result_json as ComparisonRequest | undefined) ?? null;
}

export async function listComparisonRequests(limit = 100) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const store = await localStore();
    const data = await store.read();
    return Object.values(data.comparisons)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from("comparison_requests")
    .select("result_json")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw new Error(`Could not list comparison requests: ${error.message}`);
  }

  return (data || [])
    .map((row) => row.result_json as ComparisonRequest)
    .filter(Boolean);
}

export async function updateComparisonRequestReview(input: {
  id: string;
  adminStatus: NonNullable<ComparisonRequest["adminStatus"]>;
  adminNotes?: string;
  reviewedBy?: string;
  approvedDiscountAmount?: number;
  approvedDiscountCurrency?: string;
  approvedDiscountCode?: string;
  customerReplySentAt?: string;
  customerReplyKind?: "approval" | "decline";
}) {
  const supabase = getSupabaseServerClient();
  const reviewedAt = new Date().toISOString();

  if (!supabase) {
    const store = await localStore();
    const data = await store.read();
    const current = data.comparisons[input.id];
    if (!current) return null;
    const next: ComparisonRequest = {
      ...current,
      adminStatus: input.adminStatus,
      adminNotes: input.adminNotes || "",
      reviewedAt,
      reviewedBy: input.reviewedBy || "admin",
      approvedDiscountAmount: input.approvedDiscountAmount ?? current.approvedDiscountAmount,
      approvedDiscountCurrency: input.approvedDiscountCurrency ?? current.approvedDiscountCurrency,
      approvedDiscountCode: input.approvedDiscountCode ?? current.approvedDiscountCode,
      customerReplySentAt: input.customerReplySentAt ?? current.customerReplySentAt,
      customerReplyKind: input.customerReplyKind ?? current.customerReplyKind
    };
    data.comparisons[input.id] = next;
    await store.write(data);
    memory.comparisons.set(input.id, next);
    return next;
  }

  const { data: row, error: fetchError } = await supabase
    .from("comparison_requests")
    .select("result_json")
    .eq("id", input.id)
    .maybeSingle();
  if (fetchError) {
    throw new Error(`Could not load comparison review: ${fetchError.message}`);
  }

  const current = (row?.result_json as ComparisonRequest | undefined) ?? null;
  if (!current) return null;

  const next: ComparisonRequest = {
    ...current,
    adminStatus: input.adminStatus,
    adminNotes: input.adminNotes || "",
    reviewedAt,
    reviewedBy: input.reviewedBy || "admin",
    approvedDiscountAmount: input.approvedDiscountAmount ?? current.approvedDiscountAmount,
    approvedDiscountCurrency: input.approvedDiscountCurrency ?? current.approvedDiscountCurrency,
    approvedDiscountCode: input.approvedDiscountCode ?? current.approvedDiscountCode,
    customerReplySentAt: input.customerReplySentAt ?? current.customerReplySentAt,
    customerReplyKind: input.customerReplyKind ?? current.customerReplyKind
  };

  const { error: updateError } = await supabase
    .from("comparison_requests")
    .update({
      result_json: next
    })
    .eq("id", input.id);
  if (updateError) {
    throw new Error(`Could not update comparison review: ${updateError.message}`);
  }

  return next;
}

export async function getPriceMatchConfig() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      approvedVendors: fallbackApprovedVendors,
      rules: defaultPriceMatchRules
    };
  }

  const [{ data: vendorRows }, { data: ruleRow }] = await Promise.all([
    supabase
      .from("approved_vendors")
      .select("domain, display_name, market, trust_status, trust_tier, allowed_for_price_match, auto_match_enabled, promo_parsing_mode, doll_forum_vendor, notes")
      .order("display_name", { ascending: true }),
    supabase
      .from("price_match_rules")
      .select("min_gross_margin, max_discount_percent, price_freshness_hours, code_expiry_hours, enabled")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle()
  ]);

  const approvedVendors: ApprovedVendorConfig[] = (vendorRows || []).map((row) => ({
    domain: String(row.domain).replace(/^www\./, "").toLowerCase(),
    displayName: row.display_name,
    market: row.market || undefined,
    trustStatus: row.trust_status === "owned" || row.trust_status === "trusted" ? row.trust_status : "review",
    trustTier: normalizeVendorTrustTier(row.trust_tier),
    allowedForPriceMatch: row.allowed_for_price_match,
    autoMatchEnabled: Boolean(row.auto_match_enabled),
    allowPromoAutoMatch: row.trust_status === "owned" && row.promo_parsing_mode === "owned_site_review",
    promoParsingMode: normalizePromoParsingMode(row.promo_parsing_mode),
    dollForumVendor: Boolean(row.doll_forum_vendor),
    notes: row.notes || undefined
  }));

  const rules: PriceMatchRuleConfig = ruleRow
    ? {
        minGrossMargin: Number(ruleRow.min_gross_margin),
        maxDiscountPercent: Number(ruleRow.max_discount_percent),
        freshnessHours: Number(ruleRow.price_freshness_hours),
        expiryHours: Number(ruleRow.code_expiry_hours),
        enabled: Boolean(ruleRow.enabled)
      }
    : defaultPriceMatchRules;

  return {
    approvedVendors: approvedVendors.length ? approvedVendors : fallbackApprovedVendors,
    rules
  };
}

function normalizeVendorTrustTier(value: unknown): ApprovedVendorConfig["trustTier"] {
  return value === "owned" || value === "trusted" || value === "doll_forum" ? value : "manual_review";
}

function normalizePromoParsingMode(value: unknown): ApprovedVendorConfig["promoParsingMode"] {
  return value === "owned_site_review" || value === "standard" ? value : "manual_review";
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

export async function getGuidedSession(id: string): Promise<{
  answers: QuizAnswers;
  recommendedProductIds: string[];
  createdAt?: string;
} | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const fromMemory = memory.quizSessions.get(id);
    if (fromMemory) return { ...fromMemory, answers: normalizeQuizAnswers(fromMemory.answers) };
    const store = await localStore();
    const data = await store.read();
    const localSession = data.quizSessions[id];
    return localSession ? { ...localSession, answers: normalizeQuizAnswers(localSession.answers) } : null;
  }

  const { data, error } = await supabase
    .from("guided_sessions")
    .select("answers_json,recommended_product_ids,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    answers: normalizeQuizAnswers(data.answers_json as QuizAnswers),
    recommendedProductIds: data.recommended_product_ids ?? [],
    createdAt: data.created_at ?? undefined
  };
}

function normalizeQuizAnswers(answers: QuizAnswers): QuizAnswers {
  return {
    companionType: answers.companionType ?? "female",
    budget: answers.budget,
    delivery: answers.delivery,
    material: answers.material,
    bodyType: answers.bodyType,
    sizeComfort: answers.sizeComfort,
    storage: answers.storage,
    customNeeds: answers.customNeeds,
    experience: answers.experience
  };
}

export async function saveSupportLead(input: {
  sourceFlow: string;
  name?: string;
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
      name_optional: input.name ?? null,
      email: input.email,
      question: input.question,
      product_ids: input.productIds ?? [],
      status: "new"
    })
    .select("id")
    .single();

  return data;
}

export async function saveVisualSearchRequest(request: VisualSearchRequestRecord) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    memory.visualSearchRequests.set(request.id, request);
    const store = await localStore();
    const data = await store.read();
    data.visualSearchRequests[request.id] = request;
    await store.write(data);
    return request;
  }

  await supabase.from("visual_search_requests").insert({
    id: request.id,
    customer_email_optional: request.customerEmail ?? null,
    submitted_url: request.imageUrl,
    status: request.status,
    confidence: request.results[0]?.confidence && request.results[0].confidence >= 0.75 ? "high" : request.results.length ? "medium" : "low",
    notes: request.notes ?? null,
    created_at: request.createdAt,
    updated_at: new Date().toISOString()
  });

  if (request.results.length) {
    await supabase.from("visual_search_results").insert(
      request.results.map((result) => ({
        request_id: request.id,
        provider: "apify_google_lens",
        rank: result.rank,
        result_url: result.resultUrl,
        result_domain: result.resultDomain,
        title: result.title ?? null,
        snippet: result.snippet ?? null,
        image_url: result.imageUrl ?? null,
        confidence: result.confidence ?? null,
        raw_result: result.rawResult
      }))
    );
  }

  return request;
}

export async function getVisualSearchRequest(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    const memoryRequest = memory.visualSearchRequests.get(id);
    if (memoryRequest) return memoryRequest;
    const store = await localStore();
    const data = await store.read();
    return data.visualSearchRequests[id] ?? null;
  }

  const { data: requestRow } = await supabase
    .from("visual_search_requests")
    .select("id, customer_email_optional, submitted_url, status, notes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!requestRow) return null;

  const { data: resultRows } = await supabase
    .from("visual_search_results")
    .select("rank, result_url, result_domain, title, snippet, image_url, confidence, raw_result")
    .eq("request_id", id)
    .order("rank", { ascending: true });

  return {
    id: requestRow.id,
    imageUrl: requestRow.submitted_url,
    customerEmail: requestRow.customer_email_optional ?? undefined,
    mode: "customer_lookup",
    status: requestRow.status,
    notes: requestRow.notes ?? undefined,
    results: (resultRows || []).map((row) => ({
      rank: row.rank,
      resultUrl: row.result_url,
      resultDomain: row.result_domain,
      title: row.title ?? undefined,
      snippet: row.snippet ?? undefined,
      imageUrl: row.image_url ?? undefined,
      confidence: row.confidence ?? undefined,
      rawResult: row.raw_result || {}
    })),
    catalogSuggestions: [],
    createdAt: requestRow.created_at
  } satisfies VisualSearchRequestRecord;
}
