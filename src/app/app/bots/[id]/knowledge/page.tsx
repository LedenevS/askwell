import { requireBot } from "@/lib/bots";
import { getPlan } from "@/lib/plans";
import { getBotKnowledgeStats } from "@/lib/usage";
import { KnowledgeManager } from "./KnowledgeManager";
import type { Source } from "@/lib/types";

export const metadata = { title: "Knowledge" };

export default async function KnowledgePage({ params, searchParams }: PageProps<"/app/bots/[id]/knowledge">) {
  const { id } = await params;
  const sp = await searchParams;
  const { bot, profile, supabase } = await requireBot(id);
  const plan = getPlan(profile.plan);
  const [{ data: sources }, stats] = await Promise.all([
    supabase.from("sources").select("*").eq("bot_id", bot.id).order("created_at", { ascending: false }),
    getBotKnowledgeStats(bot.id),
  ]);

  return (
    <KnowledgeManager
      botId={bot.id}
      initialSources={(sources ?? []) as Source[]}
      limits={{
        sources: plan.limits.sourcesPerBot,
        chars: plan.limits.knowledgeChars,
        maxFileMb: plan.limits.maxFileMb,
        planName: plan.name,
      }}
      stats={stats}
      welcome={sp.welcome === "1"}
    />
  );
}
