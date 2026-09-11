import Link from "next/link";
import { BookOpen, Code2, MessageCircleQuestion, MessagesSquare } from "lucide-react";
import { requireBot } from "@/lib/bots";
import { createAdminClient } from "@/lib/supabase/admin";
import { usagePeriodStart } from "@/lib/plans";
import { Card, CardHeader, ButtonLink, Badge } from "@/components/ui";
import type { Message } from "@/lib/types";
import { relativeTime } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function BotOverviewPage({ params }: PageProps<"/app/bots/[id]">) {
  const { id } = await params;
  const { bot } = await requireBot(id);
  const admin = createAdminClient();
  const since = usagePeriodStart().toISOString();

  const [{ count: sources }, { count: convs }, { count: answers }, { count: unanswered }, { data: gaps }, { count: widgetConvs }] = await Promise.all([
    admin.from("sources").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).eq("status", "ready"),
    admin.from("conversations").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).gte("last_message_at", since),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).eq("role", "assistant").gte("created_at", since),
    admin.from("messages").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).eq("role", "assistant").eq("answered", false).gte("created_at", since),
    admin
      .from("messages")
      .select("id, conversation_id, created_at")
      .eq("bot_id", bot.id)
      .eq("role", "assistant")
      .eq("answered", false)
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("conversations").select("id", { count: "exact", head: true }).eq("bot_id", bot.id).eq("channel", "widget"),
  ]);

  // For each unanswered reply, find the question that preceded it.
  const gapQuestions: { id: string; question: string; conversationId: string; at: string }[] = [];
  for (const g of (gaps ?? []) as Pick<Message, "id" | "conversation_id" | "created_at">[]) {
    const { data: q } = await admin
      .from("messages")
      .select("content")
      .eq("conversation_id", g.conversation_id)
      .eq("role", "user")
      .lt("created_at", g.created_at)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (q) gapQuestions.push({ id: g.id, question: q.content, conversationId: g.conversation_id, at: g.created_at });
  }

  const answerRate = answers ? Math.round((((answers ?? 0) - (unanswered ?? 0)) / (answers ?? 1)) * 100) : null;
  const setupDone = (sources ?? 0) > 0;

  return (
    <div className="space-y-6">
      {!setupDone && (
        <Card className="border-brand-200 bg-brand-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-brand-900">Add some knowledge to get started</h2>
              <p className="mt-1 text-sm text-brand-800">Upload a PDF, paste your FAQ, or import a help-center page. Your assistant only answers from what you give it.</p>
            </div>
            <ButtonLink href={`/app/bots/${bot.id}/knowledge`} variant="secondary">
              Add knowledge
            </ButtonLink>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Sources" value={sources ?? 0} icon={<BookOpen className="size-4" />} href={`/app/bots/${bot.id}/knowledge`} />
        <Metric label="Conversations this month" value={convs ?? 0} icon={<MessagesSquare className="size-4" />} href={`/app/bots/${bot.id}/conversations`} />
        <Metric label="Answers given" value={answers ?? 0} icon={<MessageCircleQuestion className="size-4" />} />
        <Metric label="Answer rate" value={answerRate === null ? "—" : `${answerRate}%`} sub={unanswered ? `${unanswered} couldn't be answered` : undefined} icon={<Code2 className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Knowledge gaps"
            description="Questions your assistant couldn't answer from the docs. Fix a gap by adding a source that covers it."
            action={
              <Link href={`/app/bots/${bot.id}/conversations?filter=unanswered`} className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          {gapQuestions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">{answers ? "No gaps so far — every question was answered from your docs." : "Gaps show up here once visitors start asking questions."}</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {gapQuestions.map((g) => (
                <li key={g.id}>
                  <Link href={`/app/bots/${bot.id}/conversations?c=${g.conversationId}`} className="flex items-start gap-3 px-5 py-3 hover:bg-ink-50">
                    <Badge tone="warning" className="mt-0.5 shrink-0">
                      Gap
                    </Badge>
                    <span className="flex-1 text-sm text-ink-800">{g.question}</span>
                    <span className="shrink-0 text-xs text-ink-400">{relativeTime(g.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Next steps" />
          <ul className="space-y-3 p-5 text-sm">
            <Step done={setupDone} href={`/app/bots/${bot.id}/knowledge`} label="Add at least one source" />
            <Step done={(answers ?? 0) > 0} href={`/app/bots/${bot.id}/chat`} label="Test it in the chat playground" />
            <Step done={(widgetConvs ?? 0) > 0} href={`/app/bots/${bot.id}/widget`} label="Install the widget on your site" />
            <Step done={bot.suggested_questions.length > 0} href={`/app/bots/${bot.id}/widget`} label="Add suggested questions" />
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, icon, href }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; href?: string }) {
  const body = (
    <Card className="h-full p-4">
      <div className="flex items-center justify-between text-ink-500">
        <span className="text-xs font-medium">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-amber-700">{sub}</div>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Step({ done, href, label }: { done: boolean; href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 text-ink-800 hover:text-brand-700">
        <span className={`flex size-5 items-center justify-center rounded-full border text-[10px] ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-ink-300"}`}>{done ? "✓" : ""}</span>
        <span className={done ? "line-through text-ink-400" : ""}>{label}</span>
      </Link>
    </li>
  );
}
