"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, PLANS, planRank, type PlanId } from "@/lib/plans";
import { getUsage } from "@/lib/usage";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/* ------------------------------------------------------------------ */
/* Bots                                                                */
/* ------------------------------------------------------------------ */

const botNameSchema = z.string().trim().min(2, "Give your assistant a name.").max(60, "Keep the name under 60 characters.");

export async function createBotAction(formData: FormData): Promise<ActionResult> {
  const { profile, supabase } = await requireSession();
  const usage = await getUsage(profile);
  if (usage.botsUsed >= usage.botsLimit) {
    return {
      ok: false,
      error: `Your ${usage.plan.name} plan includes ${usage.botsLimit} assistant${usage.botsLimit === 1 ? "" : "s"}. Upgrade to add another.`,
    };
  }

  const name = botNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { ok: false, error: name.error.issues[0].message };

  const { data, error } = await supabase
    .from("bots")
    .insert({ owner_id: profile.id, name: name.data })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not create the assistant." };

  revalidatePath("/app");
  redirect(`/app/bots/${data.id}/knowledge?welcome=1`);
}

const botSettingsSchema = z.object({
  name: botNameSchema,
  welcome_message: z.string().trim().min(1, "Add a welcome message.").max(300),
  fallback_message: z.string().trim().min(1, "Add a fallback message.").max(500),
  instructions: z.string().trim().max(2000).default(""),
  is_active: z.boolean(),
});

export async function updateBotSettingsAction(botId: string, formData: FormData): Promise<ActionResult> {
  const { profile, supabase } = await requireSession();
  const plan = getPlan(profile.plan);

  const parsed = botSettingsSchema.safeParse({
    name: formData.get("name"),
    welcome_message: formData.get("welcome_message"),
    fallback_message: formData.get("fallback_message"),
    instructions: plan.limits.customInstructions ? formData.get("instructions") ?? "" : "",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from("bots").update(parsed.data).eq("id", botId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/bots/${botId}`, "layout");
  return { ok: true, message: "Settings saved." };
}

const widgetSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color."),
  launcher_label: z.string().trim().min(1).max(40),
  suggested_questions: z.array(z.string().trim().min(1).max(120)).max(4),
  allowed_origins: z.array(z.string().trim().min(1).max(120)).max(20),
});

export async function updateWidgetAction(botId: string, formData: FormData): Promise<ActionResult> {
  const { profile, supabase } = await requireSession();
  const plan = getPlan(profile.plan);

  const lines = (v: FormDataEntryValue | null) =>
    String(v ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const parsed = widgetSchema.safeParse({
    primary_color: formData.get("primary_color"),
    launcher_label: formData.get("launcher_label"),
    suggested_questions: lines(formData.get("suggested_questions")),
    allowed_origins: plan.limits.allowedOrigins ? lines(formData.get("allowed_origins")) : [],
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { error } = await supabase.from("bots").update(parsed.data).eq("id", botId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/bots/${botId}`, "layout");
  return { ok: true, message: "Widget updated." };
}

export async function deleteBotAction(botId: string): Promise<ActionResult> {
  const { supabase } = await requireSession();
  const { error } = await supabase.from("bots").delete().eq("id", botId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app");
  redirect("/app");
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const { profile, supabase } = await requireSession();
  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 80);
  const company = String(formData.get("company") ?? "").trim().slice(0, 80);
  const { error } = await supabase.from("profiles").update({ full_name, company }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Profile saved." };
}

/* ------------------------------------------------------------------ */
/* Billing (mocked — no real charges)                                   */
/* ------------------------------------------------------------------ */

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro"]),
  interval: z.enum(["month", "year"]),
  cardNumber: z.string().regex(/^\d{16}$/, "Enter a 16-digit card number."),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(2026).max(2040),
  cvc: z.string().regex(/^\d{3,4}$/, "Enter the 3-digit security code."),
  name: z.string().trim().min(2, "Enter the name on the card.").max(80),
});

function cardBrand(number: string): string {
  if (number.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "American Express";
  return "Card";
}

function luhnValid(number: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function periodEnd(from: Date, interval: "month" | "year"): Date {
  const d = new Date(from);
  if (interval === "month") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d;
}

function invoiceNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `AW-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function checkoutAction(raw: Record<string, string>): Promise<ActionResult> {
  const { profile } = await requireSession();
  const parsed = checkoutSchema.safeParse({ ...raw, cardNumber: (raw.cardNumber ?? "").replace(/\s+/g, "") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { plan, interval, cardNumber, expMonth, expYear, name } = parsed.data;

  // Mock gateway behaviour: Luhn-valid cards succeed, the classic Stripe
  // "declined" test card fails, everything else is rejected as invalid.
  if (cardNumber === "4000000000000002") return { ok: false, error: "Your card was declined. Try a different card." };
  if (!luhnValid(cardNumber)) return { ok: false, error: "That card number doesn't look right." };
  const now = new Date();
  if (expYear < now.getUTCFullYear() || (expYear === now.getUTCFullYear() && expMonth < now.getUTCMonth() + 1)) {
    return { ok: false, error: "This card has expired." };
  }

  const admin = createAdminClient();
  const target = PLANS[plan];
  const amount = (interval === "month" ? target.priceMonthly : target.priceYearly * 12) * 100;
  const end = periodEnd(now, interval);

  await admin.from("payment_methods").delete().eq("owner_id", profile.id);
  const { error: pmError } = await admin.from("payment_methods").insert({
    owner_id: profile.id,
    brand: cardBrand(cardNumber),
    last4: cardNumber.slice(-4),
    exp_month: expMonth,
    exp_year: expYear,
    is_default: true,
  });
  if (pmError) return { ok: false, error: pmError.message };

  const { error: invError } = await admin.from("invoices").insert({
    owner_id: profile.id,
    number: invoiceNumber(),
    plan,
    plan_interval: interval,
    amount_cents: amount,
    status: "paid",
    card_last4: cardNumber.slice(-4),
    period_start: now.toISOString(),
    period_end: end.toISOString(),
  });
  if (invError) return { ok: false, error: invError.message };

  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      plan_status: "active",
      plan_interval: interval,
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app", "layout");
  return { ok: true, message: `Welcome to ${target.name}, ${name.split(" ")[0]}!` };
}

/** Switch between paid plans using the card on file (prorating is out of scope for the mock). */
export async function changePlanAction(plan: PlanId, interval: "month" | "year"): Promise<ActionResult> {
  const { profile } = await requireSession();
  const admin = createAdminClient();

  if (plan === "free") {
    return cancelSubscriptionAction();
  }

  const { data: pm } = await admin.from("payment_methods").select("last4").eq("owner_id", profile.id).maybeSingle();
  if (!pm) return { ok: false, error: "Add a card first." };

  const now = new Date();
  const end = periodEnd(now, interval);
  const target = PLANS[plan];
  const amount = (interval === "month" ? target.priceMonthly : target.priceYearly * 12) * 100;

  const upgrading = planRank(plan) > planRank(profile.plan);
  if (upgrading || interval !== profile.plan_interval) {
    await admin.from("invoices").insert({
      owner_id: profile.id,
      number: invoiceNumber(),
      plan,
      plan_interval: interval,
      amount_cents: amount,
      status: "paid",
      card_last4: pm.last4,
      period_start: now.toISOString(),
      period_end: end.toISOString(),
    });
  }

  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      plan_status: "active",
      plan_interval: interval,
      current_period_end: end.toISOString(),
      cancel_at_period_end: false,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: `You're now on ${target.name}.` };
}

export async function cancelSubscriptionAction(): Promise<ActionResult> {
  const { profile } = await requireSession();
  if (profile.plan === "free") return { ok: false, error: "You're already on the Free plan." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ cancel_at_period_end: true, plan_status: "canceled" }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Your plan will end at the close of the billing period." };
}

export async function resumeSubscriptionAction(): Promise<ActionResult> {
  const { profile } = await requireSession();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ cancel_at_period_end: false, plan_status: "active" }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "Welcome back — your plan continues." };
}

/** Demo helper: immediately drop to Free (simulates the period ending). */
export async function downgradeNowAction(): Promise<ActionResult> {
  const { profile } = await requireSession();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ plan: "free", plan_status: "active", cancel_at_period_end: false, current_period_end: null })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true, message: "You're back on the Free plan." };
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function signOutAction() {
  const { supabase } = await requireSession();
  await supabase.auth.signOut();
  redirect("/");
}
