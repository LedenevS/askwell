import { createAdminClient } from "@/lib/supabase/admin";
import { chunkText } from "@/lib/ai/chunk";
import { embedTexts } from "@/lib/ai/openai";
import type { SourceType } from "@/lib/types";

const MAX_CHUNKS_PER_SOURCE = 800;

/**
 * Create a source row, chunk + embed the text, and store the chunks.
 * Runs synchronously inside the request (small/medium docs finish in seconds).
 */
export async function ingestSource(params: {
  botId: string;
  ownerId: string;
  type: SourceType;
  title: string;
  url?: string | null;
  text: string;
}): Promise<{ sourceId: string; chunkCount: number; charCount: number }> {
  const admin = createAdminClient();
  const text = params.text.trim();

  const { data: source, error: sourceError } = await admin
    .from("sources")
    .insert({
      bot_id: params.botId,
      owner_id: params.ownerId,
      type: params.type,
      title: params.title.slice(0, 200),
      url: params.url ?? null,
      status: "processing",
      char_count: text.length,
    })
    .select("id")
    .single();

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? "Could not create source.");
  }

  try {
    const chunks = chunkText(text).slice(0, MAX_CHUNKS_PER_SOURCE);
    if (chunks.length === 0) {
      throw new Error("We couldn't find any readable text in this source.");
    }

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((content, i) => ({
      source_id: source.id,
      bot_id: params.botId,
      chunk_index: i,
      content,
      embedding: JSON.stringify(embeddings[i]),
    }));

    // Insert in batches to stay under payload limits.
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await admin.from("chunks").insert(rows.slice(i, i + 100));
      if (error) throw new Error(error.message);
    }

    await admin
      .from("sources")
      .update({ status: "ready", chunk_count: chunks.length, char_count: text.length, error: null })
      .eq("id", source.id);

    return { sourceId: source.id, chunkCount: chunks.length, charCount: text.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed.";
    await admin.from("sources").update({ status: "error", error: message }).eq("id", source.id);
    throw err;
  }
}
