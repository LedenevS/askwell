/**
 * Public base URL of the app, resolved in this order:
 * 1. NEXT_PUBLIC_APP_URL (ignored when empty or not a valid absolute URL)
 * 2. Vercel's production / deployment host
 * 3. http://localhost:3000
 */
export function appUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin + parsed.pathname.replace(/\/$/, "");
      }
    } catch {
      // fall through to the platform-provided host
    }
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
