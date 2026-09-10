import type { PlanId } from "@/lib/plans";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  plan: PlanId;
  plan_status: "active" | "canceled" | "past_due";
  plan_interval: "month" | "year";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type Bot = {
  id: string;
  owner_id: string;
  name: string;
  public_key: string;
  welcome_message: string;
  fallback_message: string;
  instructions: string;
  primary_color: string;
  launcher_label: string;
  allowed_origins: string[];
  suggested_questions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SourceType = "file" | "text" | "url";
export type SourceStatus = "processing" | "ready" | "error";

export type Source = {
  id: string;
  bot_id: string;
  owner_id: string;
  type: SourceType;
  title: string;
  url: string | null;
  status: SourceStatus;
  error: string | null;
  char_count: number;
  chunk_count: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  bot_id: string;
  owner_id: string;
  channel: "playground" | "widget";
  visitor_id: string | null;
  page_url: string | null;
  message_count: number;
  unanswered_count: number;
  first_question: string | null;
  created_at: string;
  last_message_at: string;
};

export type Citation = {
  sourceId: string;
  title: string;
  url: string | null;
  snippet: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  bot_id: string;
  owner_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  answered: boolean;
  created_at: string;
};

export type PaymentMethod = {
  id: string;
  owner_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
};

export type Invoice = {
  id: string;
  owner_id: string;
  number: string;
  plan: PlanId;
  plan_interval: "month" | "year";
  amount_cents: number;
  currency: string;
  status: "paid" | "refunded" | "void";
  card_last4: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
};

/** Stream protocol for /api/chat and /api/public/chat — newline-delimited JSON. */
export type ChatStreamEvent =
  | { type: "meta"; conversationId: string; citations: Citation[] }
  | { type: "delta"; text: string }
  | { type: "done"; messageId: string; answered: boolean }
  | { type: "error"; message: string; code?: "quota" | "inactive" | "origin" | "unknown" };
