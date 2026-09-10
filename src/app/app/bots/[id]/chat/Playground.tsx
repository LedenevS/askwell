"use client";

import * as React from "react";
import Link from "next/link";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, Card } from "@/components/ui";
import type { Bot } from "@/lib/types";

export function Playground({ bot, hasKnowledge, showBranding, modelLabel }: { bot: Bot; hasKnowledge: boolean; showBranding: boolean; modelLabel: string }) {
  const [quotaHit, setQuotaHit] = React.useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chat playground"
        description="Talk to your assistant exactly as a visitor would. Every reply cites the sources it used, so you can see where an answer came from."
      />

      {!hasKnowledge && (
        <Alert tone="warning">
          This assistant has no knowledge yet, so it will say it can’t help.{" "}
          <Link href={`/app/bots/${bot.id}/knowledge`} className="font-medium underline">
            Add a source
          </Link>{" "}
          first.
        </Alert>
      )}

      {quotaHit && (
        <Alert tone="warning">
          You’ve hit this month’s answer limit.{" "}
          <Link href="/app/billing" className="font-medium underline">
            Upgrade your plan
          </Link>{" "}
          to keep testing.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2" style={{ height: "min(680px, calc(100vh - 260px))" }}>
          <ChatWindow
            botName={bot.name}
            welcomeMessage={bot.welcome_message}
            primaryColor={bot.primary_color}
            suggestedQuestions={bot.suggested_questions}
            showBranding={showBranding}
            send={(message, conversationId) =>
              fetch("/api/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ botId: bot.id, message, conversationId }),
              })
            }
            onUpgradeNeeded={() => setQuotaHit(true)}
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-5 text-sm">
            <h3 className="font-semibold text-ink-900">How answers work</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-ink-600">
              <li>Your question is matched against every passage in your sources.</li>
              <li>The best matches are handed to the model (<code className="rounded bg-ink-100 px-1 text-xs">{modelLabel}</code>) as the only context it may use.</li>
              <li>If nothing relevant is found, the assistant says so instead of guessing — and the question shows up as a knowledge gap.</li>
            </ol>
          </Card>
          <Card className="p-5 text-sm">
            <h3 className="font-semibold text-ink-900">Playground chats count</h3>
            <p className="mt-2 text-ink-600">Answers here use the same monthly allowance as your widget, so you can test exactly what visitors will see.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
