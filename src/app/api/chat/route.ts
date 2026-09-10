import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { answerQuestion, ChatError } from "@/lib/ai/answer";
import type { Bot } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  botId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const { data: bot } = await session.supabase.from("bots").select("*").eq("id", parsed.data.botId).maybeSingle();
  if (!bot) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });

  try {
    const stream = await answerQuestion({
      bot: bot as Bot,
      owner: session.profile,
      channel: "playground",
      question: parsed.data.message,
      conversationId: parsed.data.conversationId ?? null,
    });
    return new Response(stream, {
      headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ChatError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === "quota" ? 402 : 400 });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 500 });
  }
}
