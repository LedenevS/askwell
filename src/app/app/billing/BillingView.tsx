"use client";

import * as React from "react";
import { Check, CreditCard, Receipt, X } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Progress, cn } from "@/components/ui";
import { PLANS, PLAN_ORDER, planRank, type PlanId } from "@/lib/plans";
import { formatDate, formatMoney } from "@/lib/format";
import { cancelSubscriptionAction, changePlanAction, checkoutAction, downgradeNowAction, resumeSubscriptionAction } from "@/app/app/actions";
import type { Invoice, PaymentMethod, Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  usage: { messagesUsed: number; messagesLimit: number; botsUsed: number; botsLimit: number; periodEnd: string };
  invoices: Invoice[];
  paymentMethod: PaymentMethod | null;
  intent: string | null;
};

export function BillingView({ profile, usage, invoices, paymentMethod, intent }: Props) {
  const [interval, setInterval] = React.useState<"month" | "year">(profile.plan_interval ?? "month");
  const [checkout, setCheckout] = React.useState<PlanId | null>(intent === "starter" || intent === "pro" ? intent : null);
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const current = PLANS[profile.plan];
  const canceled = profile.cancel_at_period_end;

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setNotice(res.ok ? { ok: true, text: res.message ?? "Done." } : { ok: false, text: res.error ?? "Something went wrong." });
    });

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <PageHeader title="Plan & billing" description="Upgrade, downgrade or cancel any time. Changes take effect immediately." />

      {notice && (
        <Alert tone={notice.ok ? "success" : "error"} className="mb-6">
          {notice.text}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-ink-900">{current.name} plan</h2>
                {canceled ? <Badge tone="warning">Cancels {formatDate(profile.current_period_end)}</Badge> : <Badge tone="success">Active</Badge>}
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {current.priceMonthly === 0
                  ? "Free forever. Upgrade when you need more room."
                  : `${formatMoney((profile.plan_interval === "year" ? current.priceYearly * 12 : current.priceMonthly) * 100)} / ${profile.plan_interval === "year" ? "year" : "month"} · renews ${formatDate(profile.current_period_end)}`}
              </p>
            </div>
            {profile.plan !== "free" && (
              <div className="flex gap-2">
                {canceled ? (
                  <Button variant="outline" size="sm" loading={pending} onClick={() => run(resumeSubscriptionAction)}>
                    Resume plan
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" loading={pending} onClick={() => confirm("Cancel your subscription? You keep your plan until the end of the billing period.") && run(cancelSubscriptionAction)}>
                    Cancel plan
                  </Button>
                )}
                {canceled && (
                  <Button variant="ghost" size="sm" loading={pending} onClick={() => run(downgradeNowAction)} title="Demo shortcut: simulate the period ending">
                    End now
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-700">Answers this month</span>
                <span className="font-medium text-ink-900">
                  {usage.messagesUsed} / {usage.messagesLimit}
                </span>
              </div>
              <div className="mt-2">
                <Progress value={usage.messagesUsed} max={usage.messagesLimit} />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">Resets {formatDate(usage.periodEnd)}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-700">Assistants</span>
                <span className="font-medium text-ink-900">
                  {usage.botsUsed} / {usage.botsLimit}
                </span>
              </div>
              <div className="mt-2">
                <Progress value={usage.botsUsed} max={usage.botsLimit} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <CreditCard className="size-4" /> Payment method
          </div>
          {paymentMethod ? (
            <div className="mt-3 text-sm text-ink-700">
              {paymentMethod.brand} ending in {paymentMethod.last4}
              <div className="text-xs text-ink-500">
                Expires {String(paymentMethod.exp_month).padStart(2, "0")}/{paymentMethod.exp_year}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">No card on file. You’ll add one when you upgrade.</p>
          )}
          <p className="mt-4 text-xs text-ink-400">Demo mode: cards are validated but never charged.</p>
        </Card>
      </div>

      {/* Plans */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Plans</h2>
          <IntervalToggle value={interval} onChange={setInterval} />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = id === profile.plan && (id === "free" || interval === profile.plan_interval);
            const price = interval === "month" ? p.priceMonthly : p.priceYearly;
            const isUpgrade = planRank(id) > planRank(profile.plan);
            return (
              <Card key={id} className={cn("flex flex-col p-5", p.highlight && "border-brand-500 ring-1 ring-brand-500")}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink-900">{p.name}</h3>
                  {isCurrent && <Badge tone="brand">Current</Badge>}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-ink-900">${price}</span>
                  <span className="text-sm text-ink-500">/ month</span>
                </div>
                {interval === "year" && price > 0 && <div className="text-xs text-ink-500">billed ${price * 12} yearly</div>}
                <p className="mt-2 text-sm text-ink-500">{p.tagline}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-700">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-600" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Your plan
                    </Button>
                  ) : id === "free" ? (
                    <Button variant="outline" className="w-full" loading={pending} onClick={() => confirm("Downgrade to Free at the end of your billing period?") && run(cancelSubscriptionAction)}>
                      Downgrade
                    </Button>
                  ) : paymentMethod ? (
                    <Button variant={isUpgrade ? "secondary" : "outline"} className="w-full" loading={pending} onClick={() => run(() => changePlanAction(id, interval))}>
                      {isUpgrade ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                    </Button>
                  ) : (
                    <Button variant={p.highlight ? "secondary" : "primary"} className="w-full" onClick={() => setCheckout(id)}>
                      {p.cta}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      <div className="mt-10">
        <Card>
          <CardHeader title="Invoices" description="Receipts for every payment." />
          {invoices.length === 0 ? (
            <div className="flex items-center gap-2 px-5 py-8 text-sm text-ink-500">
              <Receipt className="size-4" /> No invoices yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-400">
                <tr>
                  <th className="px-5 py-2 font-medium">Invoice</th>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-5 py-2 font-medium">Plan</th>
                  <th className="px-5 py-2 font-medium">Amount</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink-700">{inv.number}</td>
                    <td className="px-5 py-3 text-ink-700">{formatDate(inv.created_at)}</td>
                    <td className="px-5 py-3 text-ink-700">
                      {PLANS[inv.plan].name} · {inv.plan_interval === "year" ? "yearly" : "monthly"}
                    </td>
                    <td className="px-5 py-3 text-ink-900">{formatMoney(inv.amount_cents)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={inv.status === "paid" ? "success" : "neutral"}>{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {checkout && (
        <CheckoutModal
          plan={PLANS[checkout]}
          interval={interval}
          onClose={() => setCheckout(null)}
          onSuccess={(text) => {
            setCheckout(null);
            setNotice({ ok: true, text });
          }}
        />
      )}
    </div>
  );
}

function IntervalToggle({ value, onChange }: { value: "month" | "year"; onChange: (v: "month" | "year") => void }) {
  return (
    <div className="inline-flex rounded-lg border border-ink-200 bg-white p-0.5 text-sm">
      {(["month", "year"] as const).map((v) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={cn("rounded-md px-3 py-1.5 font-medium", value === v ? "bg-ink-900 text-white" : "text-ink-600 hover:text-ink-900")}>
          {v === "month" ? "Monthly" : "Yearly · save ~17%"}
        </button>
      ))}
    </div>
  );
}

export function CheckoutModal({ plan, interval, onClose, onSuccess }: { plan: (typeof PLANS)[PlanId]; interval: "month" | "year"; onClose: () => void; onSuccess: (text: string) => void }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [card, setCard] = React.useState("");
  const total = interval === "month" ? plan.priceMonthly : plan.priceYearly * 12;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 id="checkout-title" className="font-semibold text-ink-900">
            Upgrade to {plan.name}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <form
          className="space-y-4 px-5 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const raw = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, String(v)])) as Record<string, string>;
            setError(null);
            startTransition(async () => {
              const res = await checkoutAction({ ...raw, plan: plan.id, interval });
              if (res.ok) onSuccess(res.message ?? "Upgraded.");
              else setError(res.error);
            });
          }}
        >
          <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm">
            <span className="text-ink-700">
              {plan.name} · billed {interval === "month" ? "monthly" : "yearly"}
            </span>
            <span className="font-semibold text-ink-900">${total}</span>
          </div>

          <Field label="Name on card">
            <Input name="name" placeholder="Jane Doe" required autoComplete="cc-name" />
          </Field>
          <Field label="Card number" help="Demo mode — use 4242 4242 4242 4242. Use 4000 0000 0000 0002 to see a decline.">
            <Input
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card}
              onChange={(e) =>
                setCard(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16)
                    .replace(/(\d{4})(?=\d)/g, "$1 "),
                )
              }
              required
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Month">
              <Input name="expMonth" placeholder="12" inputMode="numeric" maxLength={2} required autoComplete="cc-exp-month" />
            </Field>
            <Field label="Year">
              <Input name="expYear" placeholder="2028" inputMode="numeric" maxLength={4} required autoComplete="cc-exp-year" />
            </Field>
            <Field label="CVC">
              <Input name="cvc" placeholder="123" inputMode="numeric" maxLength={4} required autoComplete="cc-csc" />
            </Field>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Button type="submit" variant="secondary" className="w-full" size="lg" loading={pending}>
            Pay ${total} and upgrade
          </Button>
          <p className="text-center text-xs text-ink-400">Simulated checkout. No real payment is processed. Cancel any time.</p>
        </form>
      </div>
    </div>
  );
}
