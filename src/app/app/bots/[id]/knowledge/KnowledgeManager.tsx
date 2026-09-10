"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, FileText, Globe, Loader2, Trash2, Type, Upload } from "lucide-react";
import { Alert, Button, Card, CardHeader, Field, Input, Progress, Textarea, cn } from "@/components/ui";
import { PageHeader } from "@/components/app/PageHeader";
import { formatBytesish, relativeTime } from "@/lib/format";
import { formatChars } from "@/lib/plans";
import type { Source } from "@/lib/types";

type Props = {
  botId: string;
  initialSources: Source[];
  limits: { sources: number; chars: number; maxFileMb: number; planName: string };
  stats: { sources: number; chars: number };
  welcome?: boolean;
};

type Tab = "file" | "text" | "url";

export function KnowledgeManager({ botId, initialSources, limits, stats, welcome }: Props) {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>("file");
  const [sources, setSources] = React.useState<Source[]>(initialSources);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [limitHit, setLimitHit] = React.useState(false);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const [prevInitial, setPrevInitial] = React.useState(initialSources);
  if (prevInitial !== initialSources) {
    setPrevInitial(initialSources);
    setSources(initialSources);
  }

  const submit = async (fd: FormData, label: string) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    setLimitHit(false);
    setProgress(`Reading ${label}…`);
    fd.set("botId", botId);
    const timer = setTimeout(() => setProgress("Splitting into passages and indexing… this takes a few seconds."), 1500);
    try {
      const res = await fetch("/api/sources", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (data.code === "limit") setLimitHit(true);
        return false;
      }
      setSuccess(`Added “${label}” — ${data.chunkCount} passages indexed. Your assistant can answer from it right away.`);
      router.refresh();
      return true;
    } catch {
      setError("Upload failed. Check your connection and try again.");
      return false;
    } finally {
      clearTimeout(timer);
      setBusy(false);
      setProgress(null);
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("kind", "file");
      fd.set("file", file);
      const ok = await submit(fd, file.name);
      if (!ok) break;
    }
  };

  const remove = async (s: Source) => {
    if (!confirm(`Remove “${s.title}”? The assistant will stop using it immediately.`)) return;
    setSources((list) => list.filter((x) => x.id !== s.id));
    const res = await fetch(`/api/sources/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      setSources((list) => [s, ...list]);
      setError("Couldn't remove that source. Try again.");
    } else {
      router.refresh();
    }
  };

  const ready = sources.filter((s) => s.status === "ready");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge"
        description="Everything your assistant knows comes from here. Add help articles, policies, product docs, FAQs — anything a support agent would read before answering."
      />

      {welcome && sources.length === 0 && (
        <Alert tone="info">
          <strong>Nice — your assistant exists.</strong> Now give it something to read. Even a single FAQ page is enough to start testing.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="flex border-b border-ink-100">
              {(
                [
                  { id: "file", label: "Upload files", icon: <Upload className="size-4" /> },
                  { id: "text", label: "Paste text", icon: <Type className="size-4" /> },
                  { id: "url", label: "Web page", icon: <Globe className="size-4" /> },
                ] as { id: Tab; label: string; icon: React.ReactNode }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium",
                    tab === t.id ? "border-ink-900 text-ink-900" : "border-transparent text-ink-500 hover:text-ink-800",
                  )}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === "file" && (
                <div>
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
                    }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                      dragging ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-ink-300 hover:bg-ink-50",
                      busy && "pointer-events-none opacity-60",
                    )}
                  >
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.docx,.md,.markdown,.txt,.csv,.html,.htm"
                      disabled={busy}
                      onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                    />
                    <Upload className="mb-3 size-6 text-ink-400" />
                    <p className="text-sm font-medium text-ink-800">Drop files here or click to browse</p>
                    <p className="mt-1 text-xs text-ink-500">PDF, DOCX, Markdown, TXT, CSV or HTML · up to {limits.maxFileMb} MB each</p>
                  </label>
                </div>
              )}

              {tab === "text" && (
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    fd.set("kind", "text");
                    const ok = await submit(fd, String(fd.get("title") || "Pasted text"));
                    if (ok) form.reset();
                  }}
                >
                  <Field label="Title" help="How this source appears in citations.">
                    <Input name="title" placeholder="Refund policy" required maxLength={200} />
                  </Field>
                  <Field label="Content">
                    <Textarea name="text" rows={8} placeholder="Paste an FAQ, a policy, release notes — anything." required />
                  </Field>
                  <Button type="submit" loading={busy}>
                    Add text
                  </Button>
                </form>
              )}

              {tab === "url" && (
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const fd = new FormData(form);
                    fd.set("kind", "url");
                    const ok = await submit(fd, String(fd.get("url")));
                    if (ok) form.reset();
                  }}
                >
                  <Field label="Page URL" help="We fetch the page once and index its text. Great for help-center articles and pricing pages.">
                    <Input name="url" type="url" placeholder="https://help.example.com/getting-started" required />
                  </Field>
                  <Button type="submit" loading={busy}>
                    Import page
                  </Button>
                </form>
              )}

              {progress && (
                <div className="mt-4 flex items-center gap-2 text-sm text-ink-600">
                  <Loader2 className="size-4 animate-spin text-brand-600" /> {progress}
                </div>
              )}
              {error && (
                <Alert tone="error" className="mt-4">
                  {error}{" "}
                  {limitHit && (
                    <Link href="/app/billing" className="font-medium underline">
                      See plans
                    </Link>
                  )}
                </Alert>
              )}
              {success && (
                <Alert tone="success" className="mt-4">
                  {success}{" "}
                  <Link href={`/app/bots/${botId}/chat`} className="font-medium underline">
                    Try asking about it →
                  </Link>
                </Alert>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={`Sources (${sources.length})`} description={ready.length ? `${ready.length} ready to answer from.` : "Nothing indexed yet."} />
            {sources.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-500">Your sources will appear here.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {sources.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-600">
                      {s.type === "url" ? <Globe className="size-4" /> : s.type === "text" ? <Type className="size-4" /> : <FileText className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink-900">{s.title}</span>
                        {s.status === "ready" && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-label="Ready" />}
                        {s.status === "processing" && <Loader2 className="size-3.5 shrink-0 animate-spin text-ink-400" aria-label="Processing" />}
                        {s.status === "error" && <AlertCircle className="size-3.5 shrink-0 text-red-600" aria-label="Error" />}
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {s.status === "error" ? (
                          <span className="text-red-700">{s.error}</span>
                        ) : (
                          <>
                            {s.chunk_count} passages · {formatBytesish(s.char_count)} · {relativeTime(s.created_at)}
                            {s.url && (
                              <>
                                {" · "}
                                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                  {new URL(s.url).hostname}
                                </a>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <button onClick={() => remove(s)} className="rounded-md p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-700" title="Remove" aria-label={`Remove ${s.title}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink-900">Plan usage</h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-ink-600">
                  <span>Sources</span>
                  <span>
                    {stats.sources} / {limits.sources}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Progress value={stats.sources} max={limits.sources} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-ink-600">
                  <span>Knowledge size</span>
                  <span>
                    {formatBytesish(stats.chars)} / {formatChars(limits.chars)}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Progress value={stats.chars} max={limits.chars} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-500">
              On the {limits.planName} plan.{" "}
              <Link href="/app/billing" className="font-medium text-brand-700 hover:underline">
                Compare plans
              </Link>
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink-900">Tips for better answers</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
              <li>• One topic per source keeps citations precise — “Refund policy” beats “All policies”.</li>
              <li>• Include the questions customers actually ask, in their words.</li>
              <li>• Update a source by removing it and adding the new version.</li>
              <li>• Check the Overview for knowledge gaps and fill them here.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
