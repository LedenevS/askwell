"use client";

import * as React from "react";
import { ArrowUp, FileText, Link2, RotateCcw } from "lucide-react";
import { Markdown } from "@/components/chat/markdown";
import type { ChatStreamEvent, Citation } from "@/lib/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  answered?: boolean;
  pending?: boolean;
  error?: string;
};

export type ChatWindowProps = {
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  suggestedQuestions?: string[];
  showBranding?: boolean;
  /** Called with the question + conversation id; must return a fetch Response streaming NDJSON. */
  send: (question: string, conversationId: string | null) => Promise<Response>;
  onConversationChange?: (id: string | null) => void;
  initialConversationId?: string | null;
  initialMessages?: ChatMessage[];
  /** Compact mode is used inside the embedded widget. */
  compact?: boolean;
  placeholder?: string;
  onUpgradeNeeded?: () => void;
};

export function ChatWindow(props: ChatWindowProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(props.initialMessages ?? []);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(props.initialConversationId ?? null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const reset = () => {
    setMessages([]);
    setConversationId(null);
    props.onConversationChange?.(null);
    inputRef.current?.focus();
  };

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: q };
    const botMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", pending: true };
    setMessages((m) => [...m, userMsg, botMsg]);

    const update = (patch: Partial<ChatMessage>) =>
      setMessages((m) => m.map((x) => (x.id === botMsg.id ? { ...x, ...patch } : x)));

    try {
      const res = await props.send(q, conversationId);
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        update({ pending: false, error: data.error ?? "Something went wrong. Please try again." });
        if (data.code === "quota") props.onUpgradeNeeded?.();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      let citations: Citation[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as ChatStreamEvent;
          if (ev.type === "meta") {
            citations = ev.citations;
            if (ev.conversationId !== conversationId) {
              setConversationId(ev.conversationId);
              props.onConversationChange?.(ev.conversationId);
            }
          } else if (ev.type === "delta") {
            text += ev.text;
            update({ content: text, pending: false });
          } else if (ev.type === "done") {
            update({ content: text, pending: false, answered: ev.answered, citations: ev.answered ? citations : [] });
          } else if (ev.type === "error") {
            update({ pending: false, error: ev.message });
          }
        }
      }
    } catch {
      update({ pending: false, error: "Connection lost. Please try again." });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const color = props.primaryColor;
  const showSuggestions = messages.length === 0 && (props.suggestedQuestions?.length ?? 0) > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div ref={listRef} className={`flex-1 space-y-4 overflow-y-auto ${props.compact ? "px-4 py-4" : "px-5 py-6"}`}>
        <Bubble role="assistant" color={color} compact={props.compact}>
          <Markdown text={props.welcomeMessage} />
        </Bubble>

        {messages.map((m) => (
          <div key={m.id} className="animate-fade-up">
            <Bubble role={m.role} color={color} compact={props.compact}>
              {m.pending ? (
                <span className="flex items-center gap-1 py-1" aria-label="Thinking">
                  <span className="typing-dot size-1.5 rounded-full bg-current" />
                  <span className="typing-dot size-1.5 rounded-full bg-current" />
                  <span className="typing-dot size-1.5 rounded-full bg-current" />
                </span>
              ) : m.error ? (
                <span className="text-red-700">{m.error}</span>
              ) : m.role === "assistant" ? (
                <Markdown text={m.content} />
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </Bubble>
            {m.role === "assistant" && m.citations && m.citations.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                {m.citations.map((c) => (
                  <CitationChip key={c.sourceId} citation={c} />
                ))}
              </div>
            )}
          </div>
        ))}

        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-1">
            {props.suggestedQuestions!.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border px-3 py-1.5 text-left text-sm transition-colors hover:bg-ink-50"
                style={{ borderColor: color, color }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`border-t border-ink-100 ${props.compact ? "px-3 py-3" : "px-5 py-4"}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-end gap-2 rounded-xl border border-ink-200 bg-white p-1.5 shadow-sm focus-within:border-ink-400"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={props.placeholder ?? `Ask ${props.botName}…`}
            aria-label="Your question"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400"
          />
          {messages.length > 0 && (
            <button type="button" onClick={reset} title="Start a new conversation" aria-label="Start a new conversation" className="mb-0.5 flex size-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700">
              <RotateCcw className="size-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="mb-0.5 flex size-8 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40"
            style={{ backgroundColor: color }}
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
        {props.showBranding && (
          <p className="mt-2 text-center text-[11px] text-ink-400">
            Powered by{" "}
            <a href="https://askwell.app" target="_blank" rel="noopener noreferrer" className="font-medium text-ink-500 hover:text-ink-800">
              Askwell
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

function Bubble({ role, color, compact, children }: { role: "user" | "assistant"; color: string; compact?: boolean; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`${compact ? "max-w-[88%]" : "max-w-[80%]"} rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "rounded-br-md text-white" : "rounded-bl-md bg-ink-100 text-ink-900"
        }`}
        style={isUser ? { backgroundColor: color } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function CitationChip({ citation }: { citation: Citation }) {
  const Icon = citation.url ? Link2 : FileText;
  const inner = (
    <>
      <Icon className="size-3 shrink-0" />
      <span className="max-w-[180px] truncate">{citation.title}</span>
    </>
  );
  const cls = "inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-600 hover:border-ink-300 hover:text-ink-900";
  return citation.url ? (
    <a href={citation.url} target="_blank" rel="noopener noreferrer" className={cls} title={citation.snippet}>
      {inner}
    </a>
  ) : (
    <span className={cls} title={citation.snippet}>
      {inner}
    </span>
  );
}
