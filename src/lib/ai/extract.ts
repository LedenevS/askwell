import * as cheerio from "cheerio";
import { normalizeText } from "@/lib/ai/chunk";

export const ACCEPTED_EXTENSIONS = ["pdf", "docx", "md", "markdown", "txt", "csv", "html", "htm"] as const;

export function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function extractFromFile(file: File): Promise<string> {
  const ext = extensionOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  switch (ext) {
    case "pdf": {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return normalizeText(result.text);
      } finally {
        await parser.destroy();
      }
    }
    case "docx": {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return normalizeText(result.value);
    }
    case "html":
    case "htm":
      return htmlToText(buffer.toString("utf8"));
    case "md":
    case "markdown":
    case "txt":
    case "csv":
      return normalizeText(buffer.toString("utf8"));
    default:
      throw new Error(`Unsupported file type ".${ext}". Upload PDF, DOCX, Markdown, TXT, CSV or HTML.`);
  }
}

export function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header, iframe, svg, form, [aria-hidden='true']").remove();
  const root = $("main").length ? $("main") : $("article").length ? $("article") : $("body");

  // Preserve block structure so chunking can respect paragraphs.
  root.find("h1, h2, h3, h4, h5, h6, p, li, tr, pre, blockquote, div, section").each((_, el) => {
    $(el).append("\n\n");
  });
  root.find("br").replaceWith("\n");

  return normalizeText(root.text());
}

export async function extractFromUrl(url: string): Promise<{ title: string; text: string }> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported.");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("That address isn't reachable from Askwell.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; AskwellBot/1.0; +https://askwell.app)",
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) throw new Error(`The page responded with ${res.status}.`);
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();

    if (contentType.includes("text/html") || /<html/i.test(body.slice(0, 2000))) {
      const $ = cheerio.load(body);
      const title = ($("title").first().text() || parsed.hostname + parsed.pathname).trim();
      return { title: title.slice(0, 200), text: htmlToText(body) };
    }
    return { title: (parsed.hostname + parsed.pathname).slice(0, 200), text: normalizeText(body) };
  } finally {
    clearTimeout(timeout);
  }
}

function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}
