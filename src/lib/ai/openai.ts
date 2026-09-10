import OpenAI from "openai";

/**
 * All model calls go through OpenRouter (OpenAI-compatible API), so the chat
 * and embedding models can be swapped via env without code changes.
 */
let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Askwell",
      },
    });
  }
  return client;
}

export const EMBEDDING_MODEL = process.env.AI_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

/** Chat models per plan tier — override with env to use any OpenRouter model. */
export const CHAT_MODELS = {
  standard: process.env.AI_CHAT_MODEL ?? "openai/gpt-4o-mini",
  premium: process.env.AI_CHAT_MODEL_PREMIUM ?? "openai/gpt-4o",
} as const;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  const batchSize = 64;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map((t) => t.replace(/\n+/g, " ").slice(0, 8000));
    const res = await openai().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    // Some providers return data out of order; sort by index to be safe.
    const sorted = [...res.data].sort((a, b) => a.index - b.index);
    for (const item of sorted) out.push(item.embedding);
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}
