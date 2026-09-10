"use client";

import * as React from "react";
import { X } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import type { Bot } from "@/lib/types";

const STORAGE_KEY = (k: string) => `askwell:${k}`;

type VisitorState = { visitorId: string; conversationId: string | null };

function loadVisitorState(key: string): VisitorState {
  if (typeof window === "undefined") return { visitorId: "", conversationId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY(key));
    const saved = raw ? (JSON.parse(raw) as Partial<VisitorState>) : {};
    const state = { visitorId: saved.visitorId ?? crypto.randomUUID(), conversationId: saved.conversationId ?? null };
    localStorage.setItem(STORAGE_KEY(key), JSON.stringify(state));
    return state;
  } catch {
    return { visitorId: crypto.randomUUID(), conversationId: null };
  }
}

const noopSubscribe = () => () => {};

export function EmbedChat({ bot, publicKey, showBranding, inWidget }: { bot: Bot; publicKey: string; showBranding: boolean; inWidget: boolean }) {
  const ready = React.useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [initial] = React.useState(() => loadVisitorState(publicKey));
  const visitorId = initial.visitorId;
  const [conversationId, setConversationId] = React.useState<string | null>(initial.conversationId);
  const pageUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    pageUrlRef.current = typeof document !== "undefined" ? document.referrer || null : null;
  }, []);

  const persist = (cid: string | null) => {
    setConversationId(cid);
    try {
      localStorage.setItem(STORAGE_KEY(publicKey), JSON.stringify({ visitorId, conversationId: cid }));
    } catch {
      /* private mode */
    }
  };

  const close = () => window.parent?.postMessage({ type: "askwell:close" }, "*");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ backgroundColor: bot.primary_color }}>
        <span className="flex size-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">{bot.name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{bot.name}</div>
          <div className="text-[11px] text-white/80">{bot.is_active ? "Answers from our docs · usually instant" : "Currently unavailable"}</div>
        </div>
        {inWidget && (
          <button onClick={close} className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close chat">
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {ready && (
          <ChatWindow
            compact
            botName={bot.name}
            welcomeMessage={bot.is_active ? bot.welcome_message : "This assistant is currently unavailable. Please check back later."}
            primaryColor={bot.primary_color}
            suggestedQuestions={bot.is_active ? bot.suggested_questions : []}
            showBranding={showBranding}
            initialConversationId={null}
            onConversationChange={persist}
            send={(message) =>
              fetch("/api/public/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ key: publicKey, message, conversationId, visitorId, pageUrl: pageUrlRef.current }),
              })
            }
          />
        )}
      </div>
    </div>
  );
}
