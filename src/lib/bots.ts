import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { Bot } from "@/lib/types";

export async function requireBot(id: string) {
  const session = await requireSession();
  const { data } = await session.supabase.from("bots").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return { ...session, bot: data as Bot };
}

export { appUrl } from "@/lib/app-url";
