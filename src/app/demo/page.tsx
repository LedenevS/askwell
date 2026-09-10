import Script from "next/script";
import Link from "next/link";
import { appUrl } from "@/lib/bots";

export const metadata = { title: "Sample site (widget preview)", robots: { index: false } };

/**
 * A fictional customer website used to preview the widget. Pass ?key=PUBLIC_KEY.
 */
export default async function DemoSitePage({ searchParams }: PageProps<"/demo">) {
  const sp = await searchParams;
  const key = typeof sp.key === "string" ? sp.key : process.env.NEXT_PUBLIC_DEMO_BOT_KEY ?? "";

  return (
    <div className="min-h-screen bg-white text-slate-800" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
        This is a sample website used to preview your Askwell widget. Look for the chat bubble in the bottom-right corner.{" "}
        <Link href="/app" className="font-medium underline">
          Back to Askwell
        </Link>
      </div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="inline-block size-6 rounded-md bg-sky-500" /> Nimbus
        </div>
        <nav className="hidden gap-6 text-sm text-slate-600 sm:flex">
          <span>Product</span>
          <span>Docs</span>
          <span>Pricing</span>
          <span>Blog</span>
        </nav>
        <span className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">Sign in</span>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-32 pt-12">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Analytics your whole team will actually open.</h1>
          <p className="mt-4 text-lg text-slate-600">Nimbus turns product events into dashboards, alerts and weekly digests — no SQL required.</p>
          <div className="mt-6 flex gap-3">
            <span className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white">Start free trial</span>
            <span className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Book a demo</span>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            ["Dashboards", "Drag-and-drop charts on top of your event stream."],
            ["Alerts", "Get pinged in Slack when a metric moves."],
            ["Digests", "A Monday-morning summary, written for humans."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-5">
              <div className="mb-3 size-8 rounded-md bg-sky-100" />
              <h3 className="font-semibold text-slate-900">{t}</h3>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl bg-slate-50 p-8">
          <h2 className="text-xl font-semibold text-slate-900">Questions? Try the chat bubble.</h2>
          <p className="mt-2 text-sm text-slate-600">Ask about pricing, data retention, integrations, or how to invite teammates — the assistant answers straight from the Nimbus docs.</p>
        </section>
      </main>

      {key ? (
        <Script src={`${appUrl()}/widget.js`} data-askwell={key} strategy="afterInteractive" />
      ) : (
        <div className="fixed bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white">No assistant key provided.</div>
      )}
    </div>
  );
}
