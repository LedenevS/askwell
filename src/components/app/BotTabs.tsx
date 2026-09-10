"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const tabs = [
  { label: "Overview", path: "" },
  { label: "Knowledge", path: "/knowledge" },
  { label: "Chat", path: "/chat" },
  { label: "Conversations", path: "/conversations" },
  { label: "Widget", path: "/widget" },
  { label: "Settings", path: "/settings" },
];

export function BotTabs({ botId }: { botId: string }) {
  const pathname = usePathname();
  const base = `/app/bots/${botId}`;
  return (
    <nav className="-mb-px mt-5 flex gap-1 overflow-x-auto" aria-label="Assistant sections">
      {tabs.map((t) => {
        const href = base + t.path;
        const active = t.path === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={t.path}
            href={href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "border-ink-900 text-ink-900" : "border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
