import type { Bot } from "@/lib/types";
import { getPlan } from "@/lib/plans";

/** Returns the origin to echo back, or null if the request is not allowed. */
export function resolveWidgetOrigin(req: Request, bot: Bot, plan: string): string | null {
  const origin = req.headers.get("origin");
  const allowList = getPlan(plan).limits.allowedOrigins ? bot.allowed_origins.filter(Boolean) : [];

  // No origin header: same-origin request (e.g. the embed iframe served by us).
  if (!origin) return "*";
  if (allowList.length === 0) return origin;

  const host = safeHost(origin);
  const ok = allowList.some((entry) => {
    const e = safeHost(entry.startsWith("http") ? entry : `https://${entry}`) ?? entry.toLowerCase();
    if (!host) return false;
    if (e.startsWith("*.")) return host === e.slice(2) || host.endsWith(e.slice(1));
    return host === e;
  });
  return ok ? origin : null;
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}
