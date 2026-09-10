-- Askwell — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user) — holds the billing plan
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  company text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  plan_status text not null default 'active' check (plan_status in ('active', 'canceled', 'past_due')),
  plan_interval text not null default 'month' check (plan_interval in ('month', 'year')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Bots
-- ---------------------------------------------------------------------------
create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  public_key text not null unique default encode(gen_random_bytes(12), 'hex'),
  welcome_message text not null default 'Hi! Ask me anything about our product and I''ll find the answer in our docs.',
  fallback_message text not null default 'I couldn''t find that in our documentation. Please contact our support team and we''ll help you out.',
  instructions text not null default '',
  primary_color text not null default '#0f766e',
  launcher_label text not null default 'Ask a question',
  allowed_origins text[] not null default '{}',
  suggested_questions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bots_owner_idx on public.bots (owner_id);

-- ---------------------------------------------------------------------------
-- Knowledge sources + chunks
-- ---------------------------------------------------------------------------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('file', 'text', 'url')),
  title text not null,
  url text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error text,
  char_count integer not null default 0,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sources_bot_idx on public.sources (bot_id);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources (id) on delete cascade,
  bot_id uuid not null references public.bots (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536)
);

create index if not exists chunks_bot_idx on public.chunks (bot_id);
create index if not exists chunks_source_idx on public.chunks (source_id);
create index if not exists chunks_embedding_idx on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Conversations + messages
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references public.bots (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null default 'widget' check (channel in ('playground', 'widget')),
  visitor_id text,
  page_url text,
  message_count integer not null default 0,
  unanswered_count integer not null default 0,
  first_question text,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create index if not exists conversations_bot_idx on public.conversations (bot_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  bot_id uuid not null references public.bots (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  answered boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists messages_owner_month_idx on public.messages (owner_id, created_at);
create index if not exists messages_unanswered_idx on public.messages (bot_id, created_at desc) where answered = false and role = 'assistant';

-- ---------------------------------------------------------------------------
-- Billing (mocked — no live payments)
-- ---------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  brand text not null,
  last4 text not null,
  exp_month integer not null,
  exp_year integer not null,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  number text not null,
  plan text not null,
  plan_interval text not null default 'month',
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'paid' check (status in ('paid', 'refunded', 'void')),
  card_last4 text,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists invoices_owner_idx on public.invoices (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Vector search RPC
-- ---------------------------------------------------------------------------
create or replace function public.match_chunks(
  p_bot_id uuid,
  p_query_embedding extensions.vector(1536),
  p_match_count integer default 6,
  p_min_similarity double precision default 0.2
)
returns table (
  chunk_id uuid,
  source_id uuid,
  source_title text,
  source_url text,
  content text,
  similarity double precision
)
language sql stable
as $$
  select
    c.id as chunk_id,
    c.source_id,
    s.title as source_title,
    s.url as source_url,
    c.content,
    1 - (c.embedding <=> p_query_embedding) as similarity
  from public.chunks c
  join public.sources s on s.id = c.source_id
  where c.bot_id = p_bot_id
    and s.status = 'ready'
    and c.embedding is not null
    and 1 - (c.embedding <=> p_query_embedding) > p_min_similarity
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- Monthly message usage for an owner (assistant replies count as messages)
create or replace function public.message_usage(p_owner_id uuid, p_from timestamptz)
returns integer
language sql stable
as $$
  select count(*)::integer
  from public.messages
  where owner_id = p_owner_id
    and role = 'assistant'
    and created_at >= p_from;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.bots enable row level security;
alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.payment_methods enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "profiles: own" on public.profiles;
create policy "profiles: own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "bots: own" on public.bots;
create policy "bots: own" on public.bots
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "sources: own" on public.sources;
create policy "sources: own" on public.sources
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "chunks: own" on public.chunks;
create policy "chunks: own" on public.chunks
  for select using (exists (select 1 from public.bots b where b.id = chunks.bot_id and b.owner_id = auth.uid()));

drop policy if exists "conversations: own" on public.conversations;
create policy "conversations: own" on public.conversations
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "messages: own" on public.messages;
create policy "messages: own" on public.messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "payment_methods: own" on public.payment_methods;
create policy "payment_methods: own" on public.payment_methods
  for select using (auth.uid() = owner_id);

drop policy if exists "invoices: own" on public.invoices;
create policy "invoices: own" on public.invoices
  for select using (auth.uid() = owner_id);

-- updated_at helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bots_touch_updated_at on public.bots;
create trigger bots_touch_updated_at
  before update on public.bots
  for each row execute procedure public.touch_updated_at();
