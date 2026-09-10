import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MessageSquare, Plus } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { createAdminClient } from "@/lib/supabase/admin";
import { usagePeriodStart } from "@/lib/plans";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import type { Bot } from "@/lib/types";

export const metadata = { title: "Assistants" };

export default async function DashboardPage() {
  const { profile, supabase } = await requireSession();
  const { data: bots } = await supabase.from("bots").select("*").order("created_at", { ascending: true });
  const list = (bots ?? []) as Bot[];

  if (list.length === 0) redirect("/app/bots/new");

  const usage = await getUsage(profile);
  const admin = createAdminClient();
  const since = usagePeriodStart().toISOString();

  const stats = await Promise.all(
    list.map(async (b) => {
      const [{ count: sources }, { count: convs }, { count: unanswered }] = await Promise.all([
        admin.from("sources").select("id", { count: "exact", head: true }).eq("bot_id", b.id).eq("status", "ready"),
        admin.from("conversations").select("id", { count: "exact", head: true }).eq("bot_id", b.id).gte("last_message_at", since),
        admin.from("messages").select("id", { count: "exact", head: true }).eq("bot_id", b.id).eq("role", "assistant").eq("answered", false).gte("created_at", since),
      ]);
      return { sources: sources ?? 0, convs: convs ?? 0, unanswered: unanswered ?? 0 };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader
        title="Your assistants"
        description={`${usage.botsUsed} of ${usage.botsLimit} included in your ${usage.plan.name} plan.`}
        action={
          usage.botsUsed < usage.botsLimit ? (
            <ButtonLink href="/app/bots/new">
              <Plus className="size-4" /> New assistant
            </ButtonLink>
          ) : (
            <ButtonLink href="/app/billing" variant="outline">
              Upgrade for more assistants
            </ButtonLink>
          )
        }
      />

      {list.length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-5" />} title="Create your first assistant" description="Upload a few docs and you'll have a working support assistant in minutes." action={<ButtonLink href="/app/bots/new">Create assistant</ButtonLink>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((b, i) => (
            <Link key={b.id} href={`/app/bots/${b.id}`} className="group">
              <Card className="h-full p-5 transition-shadow hover:shadow-pop">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg text-base font-semibold text-white" style={{ backgroundColor: b.primary_color }}>
                    {b.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-ink-900">{b.name}</h2>
                      {!b.is_active && <Badge tone="warning">Paused</Badge>}
                    </div>
                    <p className="text-xs text-ink-500">Created {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                  </div>
                  <ArrowRight className="size-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-700" />
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Sources" value={stats[i].sources} />
                  <Stat label="Chats this month" value={stats[i].convs} />
                  <Stat label="Unanswered" value={stats[i].unanswered} tone={stats[i].unanswered > 0 ? "warn" : undefined} />
                </dl>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="rounded-lg bg-ink-50 px-2 py-2.5">
      <dt className="text-[11px] text-ink-500">{label}</dt>
      <dd className={`text-lg font-semibold ${tone === "warn" ? "text-amber-700" : "text-ink-900"}`}>{value}</dd>
    </div>
  );
}
