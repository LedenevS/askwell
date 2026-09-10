"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot as BotIcon, CreditCard, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import * as React from "react";
import { Logo, Progress, cn } from "@/components/ui";
import { signOutAction } from "@/app/app/actions";
import type { Bot, Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";

type Props = {
  bots: Bot[];
  profile: Profile;
  usage: { planName: string; planId: PlanId; messagesUsed: number; messagesLimit: number };
};

export function Sidebar({ bots, profile, usage }: Props) {
  const pathname = usePathname();
  // The menu is "open for a given path": navigating closes it without an effect.
  const [openPath, setOpenPath] = React.useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    setOpenPath(next ? pathname : null);
  };

  const nav = (
    <>
      <div className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Assistants</div>
      <nav className="space-y-0.5 px-2">
        {bots.map((b) => {
          const active = pathname.startsWith(`/app/bots/${b.id}`);
          return (
            <Link
              key={b.id}
              href={`/app/bots/${b.id}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold" style={{ backgroundColor: b.primary_color, color: "#fff" }}>
                {b.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{b.name}</span>
              {!b.is_active && <span className={cn("ml-auto text-[10px]", active ? "text-white/70" : "text-ink-400")}>paused</span>}
            </Link>
          );
        })}
        <Link href="/app/bots/new" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-500 hover:bg-ink-100 hover:text-ink-800">
          <Plus className="size-4" /> New assistant
        </Link>
      </nav>

      <div className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Account</div>
      <nav className="space-y-0.5 px-2">
        <SideLink href="/app/billing" active={pathname.startsWith("/app/billing")} icon={<CreditCard className="size-4" />}>
          Plan & billing
        </SideLink>
        <SideLink href="/app/settings" active={pathname.startsWith("/app/settings")} icon={<Settings className="size-4" />}>
          Settings
        </SideLink>
      </nav>

      <div className="mt-auto space-y-3 p-3">
        <div className="rounded-lg border border-ink-200 bg-white p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-ink-800">{usage.planName} plan</span>
            <span className="text-ink-500">
              {usage.messagesUsed}/{usage.messagesLimit}
            </span>
          </div>
          <div className="mt-2">
            <Progress value={usage.messagesUsed} max={usage.messagesLimit} />
          </div>
          <p className="mt-2 text-[11px] text-ink-500">answers used this month</p>
          {usage.planId !== "pro" && (
            <Link href="/app/billing" className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline">
              Upgrade →
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink-800">{profile.full_name || "Your account"}</div>
            <div className="truncate text-xs text-ink-500">{profile.email}</div>
          </div>
          <form action={signOutAction}>
            <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800" title="Sign out" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-ink-200 bg-white px-4 lg:hidden">
        <Link href="/app">
          <Logo />
        </Link>
        <button onClick={() => setOpen((o) => !o)} className="rounded-md p-2 text-ink-700 hover:bg-ink-100" aria-label="Toggle menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      <div className="h-14 lg:hidden" />

      {open && <div className="fixed inset-0 z-30 bg-ink-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center px-4">
          <Link href="/app">
            <Logo />
          </Link>
        </div>
        {nav}
      </aside>
    </>
  );
}

function SideLink({ href, active, icon, children }: { href: string; active: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm", active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100")}>
      {icon}
      {children}
    </Link>
  );
}

export { BotIcon };
