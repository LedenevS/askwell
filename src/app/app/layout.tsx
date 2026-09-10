import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { Sidebar } from "@/components/app/Sidebar";
import type { Bot } from "@/lib/types";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { profile, supabase } = await requireSession();
  const [{ data: bots }, usage] = await Promise.all([
    supabase.from("bots").select("*").order("created_at", { ascending: true }),
    getUsage(profile),
  ]);

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar
        bots={(bots ?? []) as Bot[]}
        profile={profile}
        usage={{
          planName: usage.plan.name,
          planId: usage.plan.id,
          messagesUsed: usage.messagesUsed,
          messagesLimit: usage.messagesLimit,
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <footer className="px-6 py-4 text-xs text-ink-400">
          <Link href="/" className="hover:text-ink-700">
            Askwell
          </Link>{" "}
          · Demo environment — billing is simulated, no real charges are made.
        </footer>
      </div>
    </div>
  );
}
