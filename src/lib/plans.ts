export type PlanId = "free" | "starter" | "pro";

export type PlanLimits = {
  bots: number;
  messagesPerMonth: number;
  sourcesPerBot: number;
  knowledgeChars: number; // total characters of knowledge per bot
  maxFileMb: number;
  historyDays: number | null; // null = unlimited
  removeBranding: boolean;
  customInstructions: boolean;
  allowedOrigins: boolean;
  urlImport: boolean;
  model: "gpt-4o-mini" | "gpt-4o";
  exportConversations: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // USD
  priceYearly: number; // USD per month, billed yearly
  highlight?: boolean;
  cta: string;
  limits: PlanLimits;
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try it on one product. No card needed.",
    priceMonthly: 0,
    priceYearly: 0,
    cta: "Start for free",
    limits: {
      bots: 1,
      messagesPerMonth: 50,
      sourcesPerBot: 5,
      knowledgeChars: 200_000,
      maxFileMb: 5,
      historyDays: 7,
      removeBranding: false,
      customInstructions: false,
      allowedOrigins: false,
      urlImport: true,
      model: "gpt-4o-mini",
      exportConversations: false,
    },
    features: [
      "1 assistant",
      "50 answers / month",
      "5 sources (PDF, DOCX, Markdown, URL)",
      "Chat playground + embeddable widget",
      "7 days of conversation history",
      "“Powered by Askwell” badge",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For small teams shipping a real help center.",
    priceMonthly: 29,
    priceYearly: 24,
    highlight: true,
    cta: "Start Starter",
    limits: {
      bots: 3,
      messagesPerMonth: 1_000,
      sourcesPerBot: 50,
      knowledgeChars: 2_000_000,
      maxFileMb: 20,
      historyDays: null,
      removeBranding: true,
      customInstructions: false,
      allowedOrigins: true,
      urlImport: true,
      model: "gpt-4o-mini",
      exportConversations: false,
    },
    features: [
      "3 assistants",
      "1,000 answers / month",
      "50 sources per assistant",
      "Remove Askwell branding",
      "Restrict widget to your domains",
      "Unlimited conversation history",
      "Knowledge gap reports",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For support teams that need control and volume.",
    priceMonthly: 79,
    priceYearly: 66,
    cta: "Start Pro",
    limits: {
      bots: 10,
      messagesPerMonth: 5_000,
      sourcesPerBot: 500,
      knowledgeChars: 10_000_000,
      maxFileMb: 50,
      historyDays: null,
      removeBranding: true,
      customInstructions: true,
      allowedOrigins: true,
      urlImport: true,
      model: "gpt-4o",
      exportConversations: true,
    },
    features: [
      "10 assistants",
      "5,000 answers / month",
      "500 sources per assistant",
      "Custom persona & instructions",
      "Smarter model (GPT-4o) for tricky questions",
      "Export conversations to CSV",
      "Everything in Starter",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro"];

export function getPlan(id: string | null | undefined): Plan {
  if (id && id in PLANS) return PLANS[id as PlanId];
  return PLANS.free;
}

export function planRank(id: PlanId): number {
  return PLAN_ORDER.indexOf(id);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatChars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M characters`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k characters`;
  return `${n} characters`;
}

/** Start of the current usage period (calendar month, UTC). */
export function usagePeriodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function usagePeriodEnd(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
