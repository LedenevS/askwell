"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Lock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, Button, Card, CardHeader, Field, Input, Textarea, cn } from "@/components/ui";
import { updateWidgetAction } from "@/app/app/actions";
import type { Bot } from "@/lib/types";

const PRESETS = ["#0f766e", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#171614"];

export function WidgetSetup({ bot, appUrl, canRestrictOrigins, showBranding, planName }: { bot: Bot; appUrl: string; canRestrictOrigins: boolean; showBranding: boolean; planName: string }) {
  const [color, setColor] = React.useState(bot.primary_color);
  const [label, setLabel] = React.useState(bot.launcher_label);
  const [copied, setCopied] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const snippet = `<script src="${appUrl}/widget.js" data-askwell="${bot.public_key}" async></script>`;

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Website widget" description="A floating chat bubble your visitors can open on any page. One script tag, no build step." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader title="Install" description="Paste this before the closing </body> tag of your site. Works with any CMS or framework." />
            <div className="p-5">
              <pre className="overflow-x-auto rounded-lg bg-ink-900 p-4 text-xs leading-relaxed text-ink-100">
                <code>{snippet}</code>
              </pre>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy snippet"}
                </Button>
                <a href={`/demo?key=${bot.public_key}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
                  Preview on a sample site <ExternalLink className="size-3.5" />
                </a>
              </div>
              {!bot.is_active && (
                <Alert tone="warning" className="mt-4">
                  This assistant is paused, so the widget will tell visitors it’s unavailable. Resume it in{" "}
                  <Link href={`/app/bots/${bot.id}/settings`} className="font-medium underline">
                    Settings
                  </Link>
                  .
                </Alert>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Appearance & behaviour" />
            <form
              className="space-y-5 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                setResult(null);
                startTransition(async () => {
                  const res = await updateWidgetAction(bot.id, fd);
                  setResult(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
                });
              }}
            >
              <div>
                <div className="mb-1.5 text-sm font-medium text-ink-800">Accent color</div>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => setColor(c)} className={cn("size-8 rounded-full border-2", color === c ? "border-ink-900" : "border-transparent")} style={{ backgroundColor: c }} aria-label={`Use ${c}`} />
                  ))}
                  <label className="ml-2 flex items-center gap-2 text-sm text-ink-600">
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-8 cursor-pointer rounded border border-ink-200" aria-label="Custom color" />
                    Custom
                  </label>
                  <input type="hidden" name="primary_color" value={color} />
                </div>
              </div>

              <Field label="Launcher label" help="Shown next to the chat bubble on desktop.">
                <Input name="launcher_label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} required />
              </Field>

              <Field label="Suggested questions" hint="one per line, up to 4" help="Shown when a chat starts. Great for nudging visitors toward what your docs cover best.">
                <Textarea name="suggested_questions" rows={4} defaultValue={bot.suggested_questions.join("\n")} placeholder={"How do I reset my password?\nWhat's your refund policy?"} />
              </Field>

              <div>
                <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-800">
                  Allowed websites {!canRestrictOrigins && <Lock className="size-3.5 text-ink-400" />}
                </div>
                {canRestrictOrigins ? (
                  <>
                    <Textarea name="allowed_origins" rows={3} defaultValue={bot.allowed_origins.join("\n")} placeholder={"example.com\n*.example.com"} />
                    <p className="mt-1.5 text-xs text-ink-500">One domain per line. Leave empty to allow the widget anywhere. Wildcards like *.example.com work.</p>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
                    Restrict the widget to your own domains on Starter and above.{" "}
                    <Link href="/app/billing" className="font-medium text-brand-700 hover:underline">
                      Upgrade
                    </Link>
                  </div>
                )}
              </div>

              {result && <Alert tone={result.ok ? "success" : "error"}>{result.text}</Alert>}
              <Button type="submit" loading={pending}>
                Save widget
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">Live preview</div>
            <div className="relative h-[520px] overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-ink-100 to-ink-200 p-4">
              <div className="space-y-2 opacity-60">
                <div className="h-3 w-1/2 rounded bg-white" />
                <div className="h-3 w-3/4 rounded bg-white" />
                <div className="h-3 w-2/3 rounded bg-white" />
                <div className="h-24 rounded bg-white" />
                <div className="h-3 w-1/2 rounded bg-white" />
              </div>
              <div className="absolute bottom-4 right-4 w-[300px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop">
                <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ backgroundColor: color }}>
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-xs font-semibold">{bot.name.slice(0, 1).toUpperCase()}</span>
                  <div className="text-sm font-medium">{bot.name}</div>
                </div>
                <div className="space-y-3 p-3">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-ink-100 px-3 py-2 text-xs text-ink-800">{bot.welcome_message}</div>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-xs text-white" style={{ backgroundColor: color }}>
                    How do I get started?
                  </div>
                </div>
                <div className="border-t border-ink-100 p-2">
                  <div className="rounded-lg border border-ink-200 px-3 py-2 text-xs text-ink-400">Ask {bot.name}…</div>
                  {showBranding && <p className="mt-1.5 text-center text-[10px] text-ink-400">Powered by Askwell</p>}
                </div>
              </div>
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-pop" style={{ backgroundColor: color }}>
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 5h16v10H9l-5 4z" />
                </svg>
                {label || "Ask a question"}
              </div>
            </div>
            {showBranding && (
              <p className="mt-3 text-xs text-ink-500">
                The “Powered by Askwell” badge is shown on the {planName} plan.{" "}
                <Link href="/app/billing" className="font-medium text-brand-700 hover:underline">
                  Remove it
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
