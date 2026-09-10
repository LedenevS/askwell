import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  secondary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  outline: "border border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export const inputClass =
  "block w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-ink-50 disabled:text-ink-500";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "min-h-24 resize-y", className)} {...props} />;
}

export function Label({ className, children, hint, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-ink-800", className)} {...props}>
      {children}
      {hint && <span className="ml-2 font-normal text-ink-400">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, help, children, htmlFor }: { label: string; hint?: string; help?: React.ReactNode; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
      {help && <p className="mt-1.5 text-xs text-ink-500">{help}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-ink-200 bg-white shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
      <div>
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700",
    brand: "bg-brand-100 text-brand-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Alert({ tone = "info", children, className }: { tone?: "info" | "error" | "success" | "warning"; children: React.ReactNode; className?: string }) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-lg border px-3.5 py-2.5 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}

export function Progress({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "warning" | "danger" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = { brand: "bg-brand-600", warning: "bg-amber-500", danger: "bg-red-500" };
  const autoTone = pct >= 100 ? "danger" : pct >= 80 ? "warning" : tone;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className={cn("h-full rounded-full transition-all", colors[autoTone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", dark ? "text-white" : "text-ink-900", className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 5h16v10H9l-5 4z" />
          <path d="M9 9h6" />
        </svg>
      </span>
      Askwell
    </span>
  );
}
