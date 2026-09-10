/**
 * Seeds a demo account with the fictional "Nimbus Help" assistant used by the
 * landing-page live demo.
 *
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY
 * (loaded from .env.local). Prints the public key to put in NEXT_PUBLIC_DEMO_BOT_KEY.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { ingestSource } from "../src/lib/ingest";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@askwell.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "askwell-demo-2026";

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Demo user
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    userId = existing.id;
    console.log(`Demo user exists: ${DEMO_EMAIL}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Demo Account" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created demo user ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  }

  await admin.from("profiles").upsert({ id: userId, email: DEMO_EMAIL, full_name: "Demo Account", company: "Nimbus Analytics", plan: "starter", plan_status: "active", plan_interval: "month", current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString() });

  // 2. Bot
  const { data: bots } = await admin.from("bots").select("*").eq("owner_id", userId).eq("name", "Nimbus Help");
  let bot = bots?.[0];
  if (!bot) {
    const { data, error } = await admin
      .from("bots")
      .insert({
        owner_id: userId,
        name: "Nimbus Help",
        welcome_message: "Hi! I answer from the Nimbus docs. Ask me about pricing, data retention, integrations or how to invite your team.",
        fallback_message: "I couldn't find that in the Nimbus docs. Email support@nimbus.example and a human will get back to you within one business day.",
        primary_color: "#0f766e",
        launcher_label: "Ask Nimbus",
        suggested_questions: ["How much does Nimbus cost?", "How long do you keep my data?", "Can I invite my team?", "Is there a Zapier integration?"],
      })
      .select("*")
      .single();
    if (error) throw error;
    bot = data;
    console.log("Created bot Nimbus Help");
  }

  // 3. Sources
  const dir = join(process.cwd(), "seed", "nimbus-docs");
  const { data: existingSources } = await admin.from("sources").select("title").eq("bot_id", bot.id);
  const have = new Set((existingSources ?? []).map((s) => s.title));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(dir, file), "utf8");
    const title = text.split("\n")[0].replace(/^#\s*/, "").trim() || file;
    if (have.has(title)) {
      console.log(`  skip ${title}`);
      continue;
    }
    const res = await ingestSource({ botId: bot.id, ownerId: userId, type: "file", title, text });
    console.log(`  indexed ${title}: ${res.chunkCount} chunks`);
  }

  console.log("\nDone. Add to .env.local / Vercel:");
  console.log(`NEXT_PUBLIC_DEMO_BOT_KEY=${bot.public_key}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
