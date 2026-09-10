import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Server only. Bypasses RLS — use it for the public
 * widget endpoint and ingestion, and always scope queries explicitly.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
