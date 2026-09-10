import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { answerQuestion, ChatError } from "@/lib/ai/answer";
import { corsHeaders, resolveWidgetOrigin } from "@/lib/cors";
import type { Bot, Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  key: z.string().min(8).max(64),
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
  visitorId: z.string().max(64).nullable().optional(),
  pageUrl: z.string().max(500).nullable().optional(),
});

// Very small in-memory limiter per visitor (best effort on serverless).
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(id: string): boolean {
  const now = Date.now();
  const entry = hits.get(id);
  if (!entry || entry.reset < now) {
    hits.set(id, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 20;
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin") ?? "*") });
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const admin = createAdminClient();
  const { data: bot } = await admin.from("bots").select("*").eq("public_key", parsed.data.key).maybeSingle();
  if (!bot) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });

  const { data: owner } = await admin.from("profiles").select("id, plan").eq("id", bot.owner_id).single();
  if (!owner) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });

  const origin = resolveWidgetOrigin(req, bot as Bot, owner.plan);
  if (!origin) return NextResponse.json({ error: "This website isn't allowed to use this assistant.", code: "origin" }, { status: 403 });
  const headers = corsHeaders(origin);

  const visitorKey = parsed.data.visitorId ?? req.headers.get("x-forwarded-for") ?? "anon";
  if (rateLimited(`${bot.id}:${visitorKey}`)) {
    return NextResponse.json({ error: "Slow down a little — try again in a minute." }, { status: 429, headers });
  }

  try {
    const stream = await answerQuestion({
      bot: bot as Bot,
      owner: owner as Pick<Profile, "id" | "plan">,
      channel: "widget",
      question: parsed.data.message,
      conversationId: parsed.data.conversationId ?? null,
      visitorId: parsed.data.visitorId ?? null,
      pageUrl: parsed.data.pageUrl ?? null,
    });
    return new Response(stream, {
      headers: { ...headers, "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (err) {
    if (err instanceof ChatError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.code === "quota" ? 402 : 400, headers });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500, headers });
  }
}
