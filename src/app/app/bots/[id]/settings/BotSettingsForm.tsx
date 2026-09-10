"use client";

import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, Button, Card, CardHeader, Field, Input, Textarea } from "@/components/ui";
import { deleteBotAction, updateBotSettingsAction } from "@/app/app/actions";
import type { Bot } from "@/lib/types";

export function BotSettingsForm({ bot, canCustomizeInstructions }: { bot: Bot; canCustomizeInstructions: boolean }) {
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Name, tone, and what to say when the docs don't have an answer." />

      <Card>
        <CardHeader title="General" />
        <form
          className="space-y-5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setResult(null);
            startTransition(async () => {
              const res = await updateBotSettingsAction(bot.id, fd);
              setResult(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
            });
          }}
        >
          <Field label="Assistant name">
            <Input name="name" defaultValue={bot.name} maxLength={60} required />
          </Field>
          <Field label="Welcome message" help="The first thing visitors see when they open the chat.">
            <Textarea name="welcome_message" rows={2} defaultValue={bot.welcome_message} maxLength={300} required />
          </Field>
          <Field label="When there's no answer in the docs" help="The assistant says this instead of guessing. A good place to point people to email or live chat.">
            <Textarea name="fallback_message" rows={2} defaultValue={bot.fallback_message} maxLength={500} required />
          </Field>

          <div>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-800">
              Custom instructions {!canCustomizeInstructions && <Lock className="size-3.5 text-ink-400" />}
            </div>
            {canCustomizeInstructions ? (
              <>
                <Textarea name="instructions" rows={4} defaultValue={bot.instructions} maxLength={2000} placeholder={"Be warm but brief. Always call the product “Nimbus”. If someone asks about pricing, mention the 14-day trial."} />
                <p className="mt-1.5 text-xs text-ink-500">Shape tone and house style. The assistant will still only answer from your sources.</p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
                Give your assistant a persona and house rules on the Pro plan.{" "}
                <Link href="/app/billing" className="font-medium text-brand-700 hover:underline">
                  Upgrade
                </Link>
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-ink-200 p-4">
            <input type="checkbox" name="is_active" defaultChecked={bot.is_active} className="mt-0.5 size-4 accent-brand-600" />
            <span>
              <span className="block text-sm font-medium text-ink-900">Assistant is live</span>
              <span className="block text-xs text-ink-500">Untick to pause. The widget and playground will tell people the assistant is unavailable.</span>
            </span>
          </label>

          {result && <Alert tone={result.ok ? "success" : "error"}>{result.text}</Alert>}
          <Button type="submit" loading={pending}>
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="border-red-200">
        <CardHeader title="Danger zone" description="Deleting removes all sources, conversations and the widget for this assistant." />
        <div className="p-5">
          <Button
            variant="danger"
            loading={deleting}
            onClick={() => {
              if (!confirm(`Delete “${bot.name}” and everything in it? This can't be undone.`)) return;
              startDelete(async () => {
                await deleteBotAction(bot.id);
              });
            }}
          >
            Delete assistant
          </Button>
        </div>
      </Card>
    </div>
  );
}
