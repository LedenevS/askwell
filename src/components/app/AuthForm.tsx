"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    const fullName = String(fd.get("full_name") ?? "").trim();
    setBusy(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      if (error) {
        setError(friendly(error.message));
        setBusy(false);
        return;
      }
      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }
      setInfo("Check your inbox — we've sent a confirmation link. Once you click it, you're in.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(friendly(error.message));
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink-900">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-ink-500">{mode === "login" ? "Sign in to manage your assistants." : "Free plan, no card required. Your first assistant is minutes away."}</p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        {mode === "signup" && (
          <Field label="Your name">
            <Input name="full_name" placeholder="Jane Doe" autoComplete="name" required />
          </Field>
        )}
        <Field label="Email">
          <Input name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        {info && <Alert tone="success">{info}</Alert>}
        <Button type="submit" className="w-full" loading={busy}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-500">
        {mode === "login" ? (
          <>
            New to Askwell?{" "}
            <Link href="/signup" className="font-medium text-brand-700 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}

function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match.";
  if (/already registered/i.test(message)) return "There's already an account with this email. Try signing in.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for the link.";
  return message;
}
