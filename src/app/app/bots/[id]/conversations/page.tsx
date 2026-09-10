import { requireBot } from "@/lib/bots";
import { getPlan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConversationsView } from "./ConversationsView";
import type { Conversation } from "@/lib/types";

export const metadata = { title: "Conversations" };

function historySince(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

export default async function ConversationsPage({ params, searchParams }: PageProps<"/app/bots/[id]/conversations">) {
  const { id } = await params;
  const sp = await searchParams;
  const { bot, profile } = await requireBot(id);
  const plan = getPlan(profile.plan);
  const admin = createAdminClient();

  let query = admin.from("conversations").select("*").eq("bot_id", bot.id).order("last_message_at", { ascending: false }).limit(200);
  if (plan.limits.historyDays) {
    query = query.gte("last_message_at", historySince(plan.limits.historyDays));
  }
  const { data } = await query;

  return (
    <ConversationsView
      botId={bot.id}
      conversations={(data ?? []) as Conversation[]}
      initialSelected={typeof sp.c === "string" ? sp.c : null}
      initialFilter={sp.filter === "unanswered" ? "unanswered" : "all"}
      historyDays={plan.limits.historyDays}
      canExport={plan.limits.exportConversations}
    />
  );
}
