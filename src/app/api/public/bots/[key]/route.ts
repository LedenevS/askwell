import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { corsHeaders, resolveWidgetOrigin } from "@/lib/cors";
import { getPlan } from "@/lib/plans";
import type { Bot } from "@/lib/types";

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get("origin") ?? "*") });
}

/** Public widget configuration. Never returns anything private. */
export async function GET(req: Request, ctx: { params: Promise<{ key: string }> }) {
  const { key } = await ctx.params;
  const admin = createAdminClient();
  const { data: bot } = await admin.from("bots").select("*").eq("public_key", key).maybeSingle();
  if (!bot) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });
  const { data: owner } = await admin.from("profiles").select("plan").eq("id", bot.owner_id).single();
  const plan = getPlan(owner?.plan);

  const origin = resolveWidgetOrigin(req, bot as Bot, plan.id);
  if (!origin) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  return NextResponse.json(
    {
      name: bot.name,
      welcomeMessage: bot.welcome_message,
      primaryColor: bot.primary_color,
      launcherLabel: bot.launcher_label,
      suggestedQuestions: bot.suggested_questions,
      isActive: bot.is_active,
      showBranding: !plan.limits.removeBranding,
    },
    { headers: { ...corsHeaders(origin), "cache-control": "public, max-age=60" } },
  );
}
