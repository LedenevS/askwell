import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, usagePeriodStart, usagePeriodEnd, type Plan } from "@/lib/plans";
import type { Profile } from "@/lib/types";

export type Usage = {
  plan: Plan;
  periodStart: Date;
  periodEnd: Date;
  messagesUsed: number;
  messagesLimit: number;
  botsUsed: number;
  botsLimit: number;
};

export async function getUsage(profile: Pick<Profile, "id" | "plan">): Promise<Usage> {
  const admin = createAdminClient();
  const plan = getPlan(profile.plan);
  const periodStart = usagePeriodStart();

  const [{ data: used }, { count: botCount }] = await Promise.all([
    admin.rpc("message_usage", { p_owner_id: profile.id, p_from: periodStart.toISOString() }),
    admin.from("bots").select("id", { count: "exact", head: true }).eq("owner_id", profile.id),
  ]);

  return {
    plan,
    periodStart,
    periodEnd: usagePeriodEnd(),
    messagesUsed: used ?? 0,
    messagesLimit: plan.limits.messagesPerMonth,
    botsUsed: botCount ?? 0,
    botsLimit: plan.limits.bots,
  };
}

export async function getBotKnowledgeStats(botId: string): Promise<{ sources: number; chars: number }> {
  const admin = createAdminClient();
  const { data } = await admin.from("sources").select("char_count").eq("bot_id", botId).neq("status", "error");
  const rows = data ?? [];
  return { sources: rows.length, chars: rows.reduce((a, r) => a + (r.char_count ?? 0), 0) };
}
