import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import type { Bot } from "@/lib/types";

export async function requireBot(id: string) {
  const session = await requireSession();
  const { data } = await session.supabase.from("bots").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return { ...session, bot: data as Bot };
}

export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
