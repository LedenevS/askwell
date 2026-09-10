import { requireSession } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { createAdminClient } from "@/lib/supabase/admin";
import { BillingView } from "./BillingView";
import type { Invoice, PaymentMethod } from "@/lib/types";

export const metadata = { title: "Plan & billing" };

export default async function BillingPage({ searchParams }: PageProps<"/app/billing">) {
  const sp = await searchParams;
  const { profile } = await requireSession();
  const admin = createAdminClient();
  const [usage, { data: invoices }, { data: pm }] = await Promise.all([
    getUsage(profile),
    admin.from("invoices").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }).limit(24),
    admin.from("payment_methods").select("*").eq("owner_id", profile.id).eq("is_default", true).maybeSingle(),
  ]);

  return (
    <BillingView
      profile={profile}
      usage={{ messagesUsed: usage.messagesUsed, messagesLimit: usage.messagesLimit, botsUsed: usage.botsUsed, botsLimit: usage.botsLimit, periodEnd: usage.periodEnd.toISOString() }}
      invoices={(invoices ?? []) as Invoice[]}
      paymentMethod={(pm ?? null) as PaymentMethod | null}
      intent={typeof sp.plan === "string" ? sp.plan : null}
    />
  );
}
