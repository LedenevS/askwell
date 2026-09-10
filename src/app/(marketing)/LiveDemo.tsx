"use client";

import * as React from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

/**
 * Landing-page demo: talks to the public demo assistant (a fictional
 * analytics product called Nimbus) through the same endpoint the widget uses.
 */
export function LiveDemo({ publicKey }: { publicKey: string | null }) {
  const [visitorId] = React.useState(() => (typeof crypto !== "undefined" ? crypto.randomUUID() : "demo"));
  const [conversationId, setConversationId] = React.useState<string | null>(null);

  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-br from-brand-200/60 via-transparent to-amber-100/60 blur-xl" />
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop">
        <div className="flex items-center gap-3 bg-ink-900 px-4 py-3 text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold">N</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Nimbus Help</div>
            <div className="text-[11px] text-white/70">Demo assistant · trained on a fictional analytics product’s docs</div>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">Live</span>
        </div>
        <div style={{ height: 440 }}>
          {publicKey ? (
            <ChatWindow
              compact
              botName="Nimbus Help"
              welcomeMessage="Hi! I answer from the Nimbus docs. Try asking about pricing, data retention, or how to invite teammates."
              primaryColor="#0f766e"
              suggestedQuestions={["How much does Nimbus cost?", "How long do you keep my data?", "Can I invite my team?"]}
              showBranding={false}
              onConversationChange={setConversationId}
              send={(message) =>
                fetch("/api/public/chat", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ key: publicKey, message, conversationId, visitorId, pageUrl: "landing" }),
                })
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-ink-500">The live demo appears here once a demo assistant is configured.</div>
          )}
        </div>
      </div>
    </div>
  );
}
