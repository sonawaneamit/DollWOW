import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase/client";

export type RateLimitInput = {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
  storage?: "auto" | "memory";
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
  identifierHash: string;
};

type MemoryBucket = {
  requestCount: number;
  resetAt: string;
};

const memoryBuckets = new Map<string, MemoryBucket>();

export function hashRateLimitIdentifier(identifier: string) {
  return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
}

export function windowStartFor(now: Date, windowSeconds: number) {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export async function checkRateLimit(input: RateLimitInput): Promise<RateLimitResult> {
  const now = input.now ?? new Date();
  const windowStart = windowStartFor(now, input.windowSeconds);
  const resetAt = new Date(windowStart.getTime() + input.windowSeconds * 1000).toISOString();
  const identifierHash = hashRateLimitIdentifier(input.identifier || "anonymous");
  if (input.storage === "memory") {
    return checkMemoryRateLimit(input, identifierHash, windowStart, resetAt);
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return checkMemoryRateLimit(input, identifierHash, windowStart, resetAt);
  }

  const lookup = {
    scope: input.scope,
    identifier_hash: identifierHash,
    window_start: windowStart.toISOString(),
    window_seconds: input.windowSeconds
  };

  const { data: existing, error: selectError } = await supabase
    .from("rate_limits")
    .select("id, request_count")
    .match(lookup)
    .maybeSingle();

  if (selectError) {
    return checkMemoryRateLimit(input, identifierHash, windowStart, resetAt);
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("rate_limits").insert({
      ...lookup,
      request_count: 1,
      max_requests: input.limit,
      last_seen_at: now.toISOString()
    });

    if (insertError) {
      return checkMemoryRateLimit(input, identifierHash, windowStart, resetAt);
    }

    return {
      allowed: true,
      remaining: Math.max(0, input.limit - 1),
      limit: input.limit,
      resetAt,
      identifierHash
    };
  }

  const currentCount = Number(existing.request_count || 0);
  if (currentCount >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      limit: input.limit,
      resetAt,
      identifierHash
    };
  }

  const nextCount = currentCount + 1;
  const { error: updateError } = await supabase
    .from("rate_limits")
    .update({
      request_count: nextCount,
      max_requests: input.limit,
      last_seen_at: now.toISOString()
    })
    .eq("id", existing.id);

  if (updateError) {
    return checkMemoryRateLimit(input, identifierHash, windowStart, resetAt);
  }

  return {
    allowed: true,
    remaining: Math.max(0, input.limit - nextCount),
    limit: input.limit,
    resetAt,
    identifierHash
  };
}

function checkMemoryRateLimit(input: RateLimitInput, identifierHash: string, windowStart: Date, resetAt: string): RateLimitResult {
  const key = [input.scope, identifierHash, windowStart.toISOString(), input.windowSeconds].join(":");
  const current = memoryBuckets.get(key);
  const nextCount = (current?.requestCount ?? 0) + 1;
  memoryBuckets.set(key, { requestCount: nextCount, resetAt });

  return {
    allowed: nextCount <= input.limit,
    remaining: Math.max(0, input.limit - nextCount),
    limit: input.limit,
    resetAt,
    identifierHash
  };
}

export function clearMemoryRateLimitsForTests() {
  memoryBuckets.clear();
}
