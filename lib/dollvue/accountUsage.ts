import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { DOLLVUE_FREE_PREVIEWS } from "./config";
import { dollVueEmailHash } from "./session";

const FEATURE = "dollvue-preview";

export async function dollVueUsageForEmail(email: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { available: false, count: 0, remaining: 0 };
  const userEmailHash = dollVueEmailHash(email);
  const { count, error } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("feature", FEATURE)
    .eq("user_email_hash", userEmailHash)
    .eq("status", "success");
  if (error) {
    console.error("DollVue usage lookup failed", error.message);
    return { available: false, count: 0, remaining: 0 };
  }
  const used = Math.max(0, count ?? 0);
  return { available: true, count: used, remaining: Math.max(0, DOLLVUE_FREE_PREVIEWS - used) };
}

export async function recordDollVuePreview(input: {
  email: string;
  model: string;
  productHandle: string;
  selectionCount: number;
  cacheHit: boolean;
  country?: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return false;
  const { error } = await supabase.from("ai_usage_events").insert({
    feature: FEATURE,
    provider: "venice",
    model: input.model,
    route: "/dollvue/generate",
    status: "success",
    user_email_hash: dollVueEmailHash(input.email),
    metadata: {
      product_handle: input.productHandle,
      selection_count: input.selectionCount,
      cache_hit: input.cacheHit,
      country: input.country || "unknown"
    }
  });
  if (error) console.error("DollVue usage write failed", error.message);
  return !error;
}
