import * as React from "react";

/**
 * Tiny, dependency-free markdown subset for chat replies:
 * paragraphs, bullet/numbered lists, **bold**, `code`, and links.
 */
export function Markdown({ text }: { text: string }) {
  const blocks = splitBlocks(text);
  return (
    <div className="prose-chat text-[0.95rem] leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === "ul") return <ul key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
        if (b.type === "ol") return <ol key={i}>{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>;
        if (b.type === "p") return <p key={i}>{inline(b.text)}</p>;
        return null;
      })}
    </div>
  );
}

type Block = { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] };

function splitBlocks(text: string): Block[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (line === "") {
      flushPara();
      flushList();
      continue;
    }
    if (list) {
      // Continuation of the previous list item.
      list.items[list.items.length - 1] += " " + line;
      continue;
    }
    para.push(line.replace(/^#{1,6}\s+/, ""));
  }
  flushPara();
  flushList();
  return blocks;
}

function inline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k++}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      out.push(
        <a key={k++} href={m[2]} target="_blank" rel="noopener noreferrer">
          {label}
        </a>,
      );
    } else
      out.push(
        <a key={k++} href={tok} target="_blank" rel="noopener noreferrer">
          {tok}
        </a>,
      );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
