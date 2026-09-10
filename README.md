# Askwell

Turn your help docs into a support assistant that answers with citations, lives in your app as a chat playground, and embeds on any website as a widget. It also tells you which questions your docs *can't* answer yet — the knowledge-gap report — so your documentation backlog writes itself.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + pgvector, Auth, RLS) · OpenAI (`text-embedding-3-small`, `gpt-4o-mini` / `gpt-4o`) · Tailwind CSS 4 · Vercel.

## Features

- **Knowledge ingestion** — upload PDF / DOCX / Markdown / TXT / CSV / HTML, paste text, or import a web page. Text is chunked with paragraph-aware overlap, embedded, and stored in pgvector (HNSW index).
- **Grounded RAG chat** — retrieval → `gpt-4o-mini` with a strict "answer only from excerpts" prompt. Replies stream token-by-token and carry citations to the sources used. If the docs don't cover it, the assistant says so (`[NO_ANSWER]` protocol) and the question is logged as a **knowledge gap**.
- **Chat playground** in the app, and an **embeddable widget** (`<script src=".../widget.js" data-askwell="KEY">`) with a floating launcher, iframe chat, accent colour, suggested questions, domain allow-list and mobile layout.
- **Conversations inbox** — every widget/playground chat, filterable by "has gaps", with the unanswered replies highlighted and a CSV export.
- **Pricing & billing** — Free / Starter $29 / Pro $79 with server-side gating on assistants, monthly answers, sources per assistant, knowledge size, file size, history retention, branding removal, domain allow-list, custom instructions, model tier and CSV export. Billing is **simulated** (card validation with Luhn + Stripe-style test numbers, invoices, cancel/resume, plan switching) — no real payments.

## Run locally

1. Create a Supabase project. In the SQL editor, run `supabase/migrations/0001_init.sql`.
   - Optional but recommended for demos: Authentication → Providers → Email → turn **off** "Confirm email" so sign-up logs in immediately.
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL/keys and an OpenAI key.
3. Install and start:

   ```bash
   npm install
   npm run dev
   ```

4. (Optional) Seed the public demo assistant used by the landing page:

   ```bash
   npm run seed:demo
   ```

   It creates `demo@askwell.app` / `askwell-demo-2026` with a "Nimbus Help" assistant trained on the fictional docs in `seed/nimbus-docs/`, and prints the `NEXT_PUBLIC_DEMO_BOT_KEY` to add to your env.

## Deploy to Vercel

Import the repo, add the same environment variables (set `NEXT_PUBLIC_APP_URL` to your production URL — it's baked into the widget snippet), and deploy. Route handlers declare `maxDuration = 60` for ingestion and streaming.

## Project layout

```
src/app/(marketing)      landing page + live demo
src/app/(auth)           login / signup
src/app/app              authenticated product (assistants, knowledge, chat, conversations, widget, settings, billing)
src/app/embed/[key]      the page loaded inside the widget iframe
src/app/api              chat (auth'd + public), sources, conversations
src/lib/ai               chunking, extraction, embeddings, RAG answer pipeline
src/lib/plans.ts         plan definitions and limits (single source of truth for gating)
public/widget.js         embeddable widget loader
supabase/migrations      schema, RLS policies, vector search RPC
```

## Test cards (mock billing)

- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 0002` — declined
- Any other Luhn-valid number succeeds; invalid numbers are rejected.
