import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseServerEnv } from "@/lib/utils/env";

export function getSupabaseServerClient() {
  if (!hasSupabaseServerEnv()) return null;

  return createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  });
}
