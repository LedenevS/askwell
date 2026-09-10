import Link from "next/link";
import { ArrowRight, BookOpenCheck, Check, Code2, FileSearch, Globe, MessageSquareWarning, ShieldCheck, Sparkles } from "lucide-react";
import { ButtonLink, Logo, cn } from "@/components/ui";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { getSession } from "@/lib/auth";
import { LiveDemo } from "./LiveDemo";
import { appUrl } from "@/lib/bots";

export default async function LandingPage() {
  const session = await getSession();
  const demoKey = process.env.NEXT_PUBLIC_DEMO_BOT_KEY ?? null;

  return (
    <div className="bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-ink-600 md:flex">
            <a href="#how" className="hover:text-ink-900">
              How it works
            </a>
            <a href="#features" className="hover:text-ink-900">
              Features
            </a>
            <a href="#pricing" className="hover:text-ink-900">
              Pricing
            </a>
            <a href="#faq" className="hover:text-ink-900">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {session ? (
              <ButtonLink href="/app" size="sm">
                Open app <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/signup" size="sm">
                  Start free
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
              <Sparkles className="size-3.5" /> Support assistant for your help docs
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
              Your docs already know the answer. Now they can say it.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-600">
              Upload your help articles, policies and product docs. Askwell turns them into a support assistant that answers with citations — in your app and on your website — and tells you which questions your docs can’t answer yet.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/signup" size="lg">
                Create your assistant — free
              </ButtonLink>
              <a href="#demo" className="inline-flex h-12 items-center gap-2 px-2 text-base font-medium text-ink-700 hover:text-ink-900">
                Try the live demo <ArrowRight className="size-4" />
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {["No card required", "One script tag to embed", "Answers only from your docs"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand-600" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div id="demo" className="scroll-mt-24">
            <LiveDemo publicKey={demoKey} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Live in three steps. Really.</h2>
            <p className="mt-3 text-ink-600">No prompt engineering, no vector databases to run, no “AI project”. If you have docs, you have an assistant.</p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Add your knowledge",
                body: "Drop in PDFs, Word files, Markdown, or paste a help-center URL. Askwell reads it, splits it into passages and indexes every one.",
                icon: <BookOpenCheck className="size-5" />,
              },
              {
                n: "2",
                title: "Test it in the playground",
                body: "Ask the questions your customers ask. Every reply shows which source it came from, so you can trust — and fix — what it says.",
                icon: <FileSearch className="size-5" />,
              },
              {
                n: "3",
                title: "Embed it anywhere",
                body: "Paste one script tag and a chat bubble appears on your site. Same answers, same citations, your colours.",
                icon: <Code2 className="size-5" />,
              },
            ].map((s) => (
              <li key={s.n} className="rounded-xl border border-ink-200 bg-white p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white">{s.icon}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Step {s.n}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Knowledge gaps</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900">Find out what your docs are missing — from the people who tried to read them.</h2>
              <p className="mt-4 text-ink-600">
                When Askwell can’t answer from your sources, it says so instead of making something up. Every one of those moments is logged as a knowledge gap, so your docs backlog writes itself: the top unanswered questions, ranked by how often people ask.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink-700">
                {[
                  "Honest fallback instead of hallucinated answers",
                  "Every gap links to the full conversation",
                  "Fix a gap by adding one source — no retraining",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-pop">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900">Knowledge gaps</span>
                <span className="text-xs text-ink-400">This month</span>
              </div>
              <ul className="mt-4 divide-y divide-ink-100">
                {[
                  ["Can I export dashboards to PDF?", "asked 14×"],
                  ["Do you have an on-prem option?", "asked 9×"],
                  ["How do I delete my account?", "asked 6×"],
                  ["Is there a Zapier integration?", "asked 4×"],
                ].map(([q, n]) => (
                  <li key={q} className="flex items-center gap-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      <MessageSquareWarning className="size-3" /> Gap
                    </span>
                    <span className="flex-1 text-sm text-ink-800">{q}</span>
                    <span className="text-xs text-ink-400">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-24 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <ShieldCheck className="size-5" />,
                title: "Grounded, cited answers",
                body: "Replies are built only from passages in your sources and show which document they came from. If it isn't in your docs, the assistant won't claim it.",
              },
              {
                icon: <Globe className="size-5" />,
                title: "A widget that feels native",
                body: "Your accent colour, your welcome message, suggested questions, and a launcher that works on mobile. Lock it to your domains so nobody else can use your quota.",
              },
              {
                icon: <MessageSquareWarning className="size-5" />,
                title: "Every conversation, searchable",
                body: "See what visitors ask, where they asked it, and which answers came from which source. Export to CSV when you need to share.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-ink-200 p-6">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{f.icon}</span>
                <h3 className="mt-4 font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Embed */}
      <section className="border-y border-ink-100 bg-ink-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">One line. Any website.</h2>
            <p className="mt-4 text-ink-300">Works with Webflow, WordPress, Framer, Shopify, plain HTML — anything that lets you add a script tag. No SDK, no build step, no iframe wrangling.</p>
            <ButtonLink href="/signup" variant="secondary" className="mt-8">
              Get your snippet
            </ButtonLink>
          </div>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-5 text-sm leading-relaxed text-ink-100">
            <code>{`<script
  src="${appUrl()}/widget.js"
  data-askwell="YOUR_PUBLIC_KEY"
  async
></script>`}</code>
          </pre>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Simple pricing that grows with your help center</h2>
            <p className="mt-3 text-ink-600">Start free. Upgrade when you need more answers, more assistants, or your own branding.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              return (
                <div key={id} className={cn("flex flex-col rounded-2xl border bg-white p-7", p.highlight ? "border-brand-500 shadow-pop ring-1 ring-brand-500" : "border-ink-200")}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-ink-900">{p.name}</h3>
                    {p.highlight && <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-medium text-white">Most popular</span>}
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-semibold text-ink-900">${p.priceMonthly}</span>
                    <span className="text-ink-500">/ month</span>
                  </div>
                  {p.priceMonthly > 0 && <div className="mt-1 text-xs text-ink-500">or ${p.priceYearly}/mo billed yearly</div>}
                  <p className="mt-3 text-sm text-ink-600">{p.tagline}</p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm text-ink-700">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={id === "free" ? "/signup" : `/signup?plan=${id}`} variant={p.highlight ? "secondary" : "primary"} className="mt-8 w-full">
                    {p.cta}
                  </ButtonLink>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-sm text-ink-500">An “answer” is one reply from your assistant, in the playground or the widget. Unused answers don’t roll over.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-ink-100 bg-ink-50">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Questions people ask before signing up</h2>
          <dl className="mt-10 divide-y divide-ink-200">
            {[
              [
                "Will it make things up?",
                "It's designed not to. The assistant only sees passages retrieved from your sources and is instructed to say when they don't cover a question. Those moments are logged as knowledge gaps so you can add the missing doc.",
              ],
              [
                "What formats can I upload?",
                "PDF, Word (.docx), Markdown, plain text, CSV and HTML files, pasted text, and public web pages by URL. Most help-center articles import in a few seconds.",
              ],
              [
                "Does it work on my website builder?",
                "If you can add a script tag — Webflow, WordPress, Framer, Shopify, Squarespace, Next.js, anything — the widget works. Paid plans can restrict it to your own domains.",
              ],
              [
                "Where is my data stored?",
                "Your documents and conversations are stored in a managed Postgres database (Supabase) and never used to train models. Delete a source or an assistant and its data is removed immediately.",
              ],
              [
                "Can I change the assistant's tone?",
                "Welcome and fallback messages are editable on every plan. Pro adds custom instructions for persona and house style — while still answering only from your sources.",
              ],
              [
                "What happens when I hit my monthly limit?",
                "The playground asks you to upgrade; the widget politely tells visitors the assistant is temporarily unavailable and points them to your fallback contact. Nothing breaks on your site.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="py-6">
                <dt className="font-semibold text-ink-900">{q}</dt>
                <dd className="mt-2 text-sm text-ink-600">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink-900">Give your docs a voice.</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-600">Upload one FAQ and see it answer in under a minute. Free plan, no card, no sales call.</p>
        <ButtonLink href="/signup" size="lg" className="mt-8">
          Create your assistant
        </ButtonLink>
      </section>

      <footer className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-ink-500">
          <Logo />
          <div className="flex gap-6">
            <a href="#pricing" className="hover:text-ink-900">
              Pricing
            </a>
            <a href="#faq" className="hover:text-ink-900">
              FAQ
            </a>
            <Link href="/login" className="hover:text-ink-900">
              Sign in
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Askwell</span>
        </div>
      </footer>
    </div>
  );
}
