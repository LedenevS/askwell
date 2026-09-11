"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Globe, MessageSquareWarning, MonitorSmartphone, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge, Button, Card, EmptyState, cn } from "@/components/ui";
import { Markdown } from "@/components/chat/markdown";
import { formatDate, relativeTime } from "@/lib/format";
import type { Conversation, Message } from "@/lib/types";

type Props = {
  botId: string;
  conversations: Conversation[];
  initialSelected: string | null;
  initialFilter: "all" | "unanswered";
  historyDays: number | null;
  canExport: boolean;
};

export function ConversationsView({ botId, conversations, initialSelected, initialFilter, historyDays, canExport }: Props) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unanswered">(initialFilter);
  const [selected, setSelected] = React.useState<string | null>(
    initialSelected ?? (initialFilter === "unanswered" ? conversations.find((c) => c.unanswered_count > 0)?.id : conversations[0]?.id) ?? null,
  );
  const [loaded, setLoaded] = React.useState<{ id: string; messages: Message[] } | null>(null);
  const messages = loaded && loaded.id === selected ? loaded.messages : null;
  const loading = !!selected && !messages;

  const list = filter === "unanswered" ? conversations.filter((c) => c.unanswered_count > 0) : conversations;

  React.useEffect(() => {
    if (!selected) return;
    const id = selected;
    let cancelled = false;
    fetch(`/api/conversations/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setLoaded({ id, messages: d.messages ?? [] });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id, messages: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const remove = async (id: string) => {
    if (!confirm("Delete this conversation? This can't be undone.")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setSelected(null);
    router.refresh();
  };

  const exportCsv = () => {
    const rows = [["started", "channel", "page", "messages", "unanswered", "first question"]];
    for (const c of conversations) rows.push([c.created_at, c.channel, c.page_url ?? "", String(c.message_count), String(c.unanswered_count), c.first_question ?? ""]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "askwell-conversations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const current = conversations.find((c) => c.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description={
          historyDays ? (
            <>
              Showing the last {historyDays} days.{" "}
              <Link href="/app/billing" className="font-medium text-brand-700 hover:underline">
                Upgrade
              </Link>{" "}
              for unlimited history.
            </>
          ) : (
            "Every chat from your widget and the playground, with the questions your docs couldn't answer highlighted."
          )
        }
        action={
          canExport ? (
            <Button variant="outline" onClick={exportCsv} disabled={conversations.length === 0}>
              <Download className="size-4" /> Export CSV
            </Button>
          ) : (
            <Link href="/app/billing" className="text-sm text-ink-500 hover:text-ink-800">
              CSV export is on Pro
            </Link>
          )
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning className="size-5" />}
          title="No conversations yet"
          description="Chats appear here as soon as someone talks to your assistant — in the playground or through the widget."
          action={
            <Link href={`/app/bots/${botId}/chat`} className="text-sm font-medium text-brand-700 hover:underline">
              Open the playground →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="flex gap-1 border-b border-ink-100 p-2">
              {(["all", "unanswered"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn("rounded-md px-3 py-1.5 text-sm font-medium", filter === f ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100")}
                >
                  {f === "all" ? `All (${conversations.length})` : `With gaps (${conversations.filter((c) => c.unanswered_count > 0).length})`}
                </button>
              ))}
            </div>
            <ul className="max-h-[640px] divide-y divide-ink-100 overflow-y-auto">
              {list.length === 0 && <li className="px-4 py-8 text-center text-sm text-ink-500">Nothing here.</li>}
              {list.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setSelected(c.id)} className={cn("w-full px-4 py-3 text-left hover:bg-ink-50", selected === c.id && "bg-brand-50 hover:bg-brand-50")}>
                    <div className="flex items-center gap-2">
                      {c.channel === "widget" ? <Globe className="size-3.5 text-ink-400" /> : <MonitorSmartphone className="size-3.5 text-ink-400" />}
                      <span className="flex-1 truncate text-sm font-medium text-ink-900">{c.first_question ?? "Conversation"}</span>
                      <span className="text-xs text-ink-400">{relativeTime(c.last_message_at)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                      <span>{c.message_count} messages</span>
                      {c.unanswered_count > 0 && (
                        <Badge tone="warning">
                          {c.unanswered_count} gap{c.unanswered_count > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {c.page_url && <span className="truncate">· {safeHost(c.page_url)}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex min-h-[480px] flex-col lg:col-span-3">
            {!current ? (
              <div className="flex flex-1 items-center justify-center text-sm text-ink-500">Select a conversation</div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
                  <div className="text-sm">
                    <div className="font-medium text-ink-900">{current.channel === "widget" ? "Website widget" : "Playground"}</div>
                    <div className="text-xs text-ink-500">
                      {formatDate(current.created_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {current.page_url && (
                        <>
                          {" · "}
                          <a href={current.page_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {current.page_url}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(current.id)} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700" aria-label="Delete conversation">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {loading && !messages && <p className="text-sm text-ink-400">Loading…</p>}
                  {messages?.map((m) => (
                    <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "rounded-br-md bg-ink-900 text-white" : "rounded-bl-md bg-ink-100 text-ink-900")}>
                        {m.role === "assistant" ? <Markdown text={m.content} /> : <span className="whitespace-pre-wrap">{m.content}</span>}
                        {m.role === "assistant" && !m.answered && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                            <MessageSquareWarning className="size-3.5" /> Not covered by your docs —{" "}
                            <Link href={`/app/bots/${botId}/knowledge`} className="font-medium underline">
                              add a source
                            </Link>
                          </div>
                        )}
                        {m.role === "assistant" && m.citations?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {m.citations.map((c) => (
                              <span key={c.sourceId} className="rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[11px] text-ink-600" title={c.snippet}>
                                {c.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
