import { requireBot } from "@/lib/bots";
import { getPlan } from "@/lib/plans";
import { Playground } from "./Playground";

export const metadata = { title: "Chat" };

export default async function ChatPage({ params }: PageProps<"/app/bots/[id]/chat">) {
  const { id } = await params;
  const { bot, profile, supabase } = await requireBot(id);
  const plan = getPlan(profile.plan);
  const { count } = await supabase.from("sources").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).eq("status", "ready");

  return <Playground bot={bot} hasKnowledge={(count ?? 0) > 0} showBranding={!plan.limits.removeBranding} modelLabel={plan.limits.model} />;
}
