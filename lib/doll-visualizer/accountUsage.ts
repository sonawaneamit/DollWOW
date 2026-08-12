import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/client";
import { VISUALIZER_FREE_PREVIEWS } from "./config";
import { visualizerEmailHash } from "./session";

const FEATURE = "doll-visualizer-preview";

export async function visualizerUsageForEmail(email: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { available: false, count: 0, remaining: 0 };
  const userEmailHash = visualizerEmailHash(email);
  const { count, error } = await supabase
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("feature", FEATURE)
    .eq("user_email_hash", userEmailHash)
    .eq("status", "success");
  if (error) {
    console.error("Visualizer usage lookup failed", error.message);
    return { available: false, count: 0, remaining: 0 };
  }
  const used = Math.max(0, count ?? 0);
  return { available: true, count: used, remaining: Math.max(0, VISUALIZER_FREE_PREVIEWS - used) };
}

export async function recordVisualizerPreview(input: {
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
    route: "/ops/doll-visualizer/generate",
    status: "success",
    user_email_hash: visualizerEmailHash(input.email),
    metadata: {
      product_handle: input.productHandle,
      selection_count: input.selectionCount,
      cache_hit: input.cacheHit,
      country: input.country || "unknown"
    }
  });
  if (error) console.error("Visualizer usage write failed", error.message);
  return !error;
}
