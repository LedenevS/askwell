import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlan, formatChars } from "@/lib/plans";
import { getBotKnowledgeStats } from "@/lib/usage";
import { ingestSource } from "@/lib/ingest";
import { extractFromFile, extractFromUrl, extensionOf, ACCEPTED_EXTENSIONS } from "@/lib/ai/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { profile, supabase } = session;
  const plan = getPlan(profile.plan);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const botId = String(form.get("botId") ?? "");
  const kind = String(form.get("kind") ?? "");

  const { data: bot } = await supabase.from("bots").select("id").eq("id", botId).maybeSingle();
  if (!bot) return NextResponse.json({ error: "Assistant not found." }, { status: 404 });

  const stats = await getBotKnowledgeStats(botId);
  if (stats.sources >= plan.limits.sourcesPerBot) {
    return NextResponse.json(
      {
        error: `Your ${plan.name} plan allows ${plan.limits.sourcesPerBot} sources per assistant. Upgrade to add more.`,
        code: "limit",
      },
      { status: 402 },
    );
  }

  try {
    let title = "";
    let text = "";
    let url: string | null = null;
    let type: "file" | "text" | "url";

    if (kind === "file") {
      const file = form.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
      const ext = extensionOf(file.name);
      if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
        return NextResponse.json(
          { error: `“.${ext}” isn't supported. Upload PDF, DOCX, Markdown, TXT, CSV or HTML.` },
          { status: 400 },
        );
      }
      if (file.size > plan.limits.maxFileMb * 1024 * 1024) {
        return NextResponse.json(
          { error: `Files on the ${plan.name} plan can be up to ${plan.limits.maxFileMb} MB.`, code: "limit" },
          { status: 402 },
        );
      }
      type = "file";
      title = file.name;
      text = await extractFromFile(file);
    } else if (kind === "text") {
      type = "text";
      title = String(form.get("title") ?? "").trim() || "Pasted text";
      text = String(form.get("text") ?? "");
      if (text.trim().length < 20) return NextResponse.json({ error: "Paste at least a couple of sentences." }, { status: 400 });
    } else if (kind === "url") {
      type = "url";
      const raw = String(form.get("url") ?? "").trim();
      if (!raw) return NextResponse.json({ error: "Enter a URL." }, { status: 400 });
      url = raw.startsWith("http") ? raw : `https://${raw}`;
      const page = await extractFromUrl(url);
      title = page.title;
      text = page.text;
      if (text.length < 50) return NextResponse.json({ error: "That page has no readable text (it may be rendered by JavaScript). Try pasting the content instead." }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Unknown source kind." }, { status: 400 });
    }

    if (stats.chars + text.length > plan.limits.knowledgeChars) {
      return NextResponse.json(
        {
          error: `This would exceed the ${formatChars(plan.limits.knowledgeChars)} of knowledge included in your ${plan.name} plan. Upgrade for more room.`,
          code: "limit",
        },
        { status: 402 },
      );
    }

    const result = await ingestSource({ botId, ownerId: profile.id, type, title, url, text });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
