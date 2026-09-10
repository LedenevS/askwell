import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  // Profiles are created by a DB trigger; backfill defensively for users created before it existed.
  if (!profile) {
    const admin = createAdminClient();
    const { data: created } = await admin
      .from("profiles")
      .upsert({ id: user.id, email: user.email ?? null, full_name: (user.user_metadata?.full_name as string) ?? "" })
      .select("*")
      .single();
    return { user, profile: created as Profile, supabase };
  }

  return { user, profile: profile as Profile, supabase };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
