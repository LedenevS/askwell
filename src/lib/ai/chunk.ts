/**
 * Split text into overlapping chunks that respect paragraph and sentence
 * boundaries where possible. Sizes are in characters (~4 chars per token).
 */
export function chunkText(
  text: string,
  opts: { maxChars?: number; overlap?: number } = {},
): string[] {
  const maxChars = opts.maxChars ?? 1400;
  const overlap = opts.overlap ?? 200;

  const clean = normalizeText(text);
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // First split by paragraphs, then merge greedily.
  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const units: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      units.push(p);
    } else {
      // Split long paragraphs by sentences.
      const sentences = p.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [p];
      let buf = "";
      for (const s of sentences) {
        if ((buf + s).length > maxChars && buf) {
          units.push(buf.trim());
          buf = s;
        } else {
          buf += s;
        }
      }
      if (buf.trim()) units.push(buf.trim());
    }
  }

  const chunks: string[] = [];
  let current = "";
  for (const u of units) {
    if (u.length > maxChars) {
      // Hard split as a last resort.
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (let i = 0; i < u.length; i += maxChars - overlap) {
        chunks.push(u.slice(i, i + maxChars));
      }
      continue;
    }
    if ((current + "\n\n" + u).length > maxChars && current) {
      chunks.push(current);
      // Carry over the tail of the previous chunk as overlap for context.
      const tail = current.slice(-overlap);
      const lastBreak = tail.search(/[.!?]\s/);
      current = (lastBreak >= 0 ? tail.slice(lastBreak + 2) : "") + u;
      if (current.length > maxChars) current = u;
    } else {
      current = current ? current + "\n\n" + u : u;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 20);
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
