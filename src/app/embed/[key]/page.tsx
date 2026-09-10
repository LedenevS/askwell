import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plans";
import { EmbedChat } from "./EmbedChat";
import type { Bot } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/embed/[key]">) {
  const { key } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("bots").select("name").eq("public_key", key).maybeSingle();
  return { title: data?.name ?? "Chat", robots: { index: false } };
}

export default async function EmbedPage({ params, searchParams }: PageProps<"/embed/[key]">) {
  const { key } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();
  const { data: bot } = await admin.from("bots").select("*").eq("public_key", key).maybeSingle();
  if (!bot) notFound();
  const { data: owner } = await admin.from("profiles").select("plan").eq("id", bot.owner_id).single();
  const plan = getPlan(owner?.plan);

  return (
    <EmbedChat
      bot={bot as Bot}
      publicKey={key}
      showBranding={!plan.limits.removeBranding}
      inWidget={sp.mode === "widget"}
    />
  );
}
