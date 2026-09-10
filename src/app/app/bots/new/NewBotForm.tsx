"use client";

import * as React from "react";
import Link from "next/link";
import { Alert, Button, ButtonLink, Field, Input } from "@/components/ui";
import { createBotAction } from "@/app/app/actions";

export function NewBotForm({ canCreate, planName, botsLimit, isFirst }: { canCreate: boolean; planName: string; botsLimit: number; isFirst: boolean }) {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{isFirst ? "Let's set up your first assistant" : "New assistant"}</h1>
      <p className="mt-2 text-sm text-ink-500">
        An assistant answers questions from one knowledge base — usually one product or one help center. You can rename it any time.
      </p>

      {!canCreate ? (
        <div className="mt-6 space-y-4">
          <Alert tone="warning">
            Your {planName} plan includes {botsLimit} assistant{botsLimit === 1 ? "" : "s"}. Upgrade to create more, or reuse an existing one.
          </Alert>
          <div className="flex gap-3">
            <ButtonLink href="/app/billing">See plans</ButtonLink>
            <ButtonLink href="/app" variant="outline">
              Back
            </ButtonLink>
          </div>
        </div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setError(null);
            startTransition(async () => {
              const res = await createBotAction(fd);
              if (res && !res.ok) setError(res.error);
            });
          }}
        >
          <Field label="Assistant name" help="Shown to your visitors in the chat header. Something like “Acme Help” or “Nimbus Assistant”.">
            <Input name="name" placeholder="Acme Help" autoFocus required maxLength={60} />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex items-center gap-3">
            <Button type="submit" loading={pending}>
              Create assistant
            </Button>
            {!isFirst && (
              <Link href="/app" className="text-sm text-ink-500 hover:text-ink-800">
                Cancel
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
