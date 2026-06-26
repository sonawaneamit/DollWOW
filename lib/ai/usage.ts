import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/client";

export type AIUsageStatus = "success" | "fallback" | "blocked" | "error";

export type AIUsageEventInput = {
  feature: string;
  provider: string;
  model?: string;
  route?: string;
  status?: AIUsageStatus;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  sessionId?: string;
  userEmail?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
};

export type AIUsageEventRecord = {
  feature: string;
  provider: string;
  model: string | null;
  route: string | null;
  status: AIUsageStatus;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost_usd: number | null;
  session_id: string | null;
  user_email_hash: string | null;
  ip_hash: string | null;
  metadata: Record<string, unknown>;
};

export function hashPrivateIdentifier(value?: string) {
  if (!value?.trim()) return null;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function buildAIUsageEvent(input: AIUsageEventInput): AIUsageEventRecord {
  return {
    feature: input.feature,
    provider: input.provider,
    model: input.model ?? null,
    route: input.route ?? null,
    status: input.status ?? "success",
    input_tokens: positiveIntegerOrNull(input.inputTokens),
    output_tokens: positiveIntegerOrNull(input.outputTokens),
    estimated_cost_usd: positiveNumberOrNull(input.estimatedCostUsd),
    session_id: input.sessionId ?? null,
    user_email_hash: hashPrivateIdentifier(input.userEmail),
    ip_hash: hashPrivateIdentifier(input.ip),
    metadata: input.metadata ?? {}
  };
}

export async function logAIUsageEvent(input: AIUsageEventInput) {
  const record = buildAIUsageEvent(input);
  const supabase = getSupabaseServerClient();
  if (!supabase) return { stored: false, record };

  const { error } = await supabase.from("ai_usage_events").insert(record);
  return { stored: !error, error, record };
}

function positiveIntegerOrNull(value?: number) {
  if (!Number.isFinite(value) || value === undefined || value < 0) return null;
  return Math.round(value);
}

function positiveNumberOrNull(value?: number) {
  if (!Number.isFinite(value) || value === undefined || value < 0) return null;
  return value;
}
