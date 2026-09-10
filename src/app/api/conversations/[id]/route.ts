import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const { data: conversation } = await session.supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { data: messages } = await session.supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  return NextResponse.json({ conversation, messages: messages ?? [] });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await ctx.params;
  const { error } = await session.supabase.from("conversations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
