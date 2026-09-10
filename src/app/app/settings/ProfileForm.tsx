"use client";

import * as React from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { updateProfileAction } from "@/app/app/actions";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  return (
    <form
      className="space-y-5 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await updateProfileAction(fd);
          setResult(res.ok ? { ok: true, text: res.message ?? "Saved." } : { ok: false, text: res.error });
        });
      }}
    >
      <Field label="Email">
        <Input value={profile.email ?? ""} disabled />
      </Field>
      <Field label="Full name">
        <Input name="full_name" defaultValue={profile.full_name ?? ""} maxLength={80} />
      </Field>
      <Field label="Company">
        <Input name="company" defaultValue={profile.company ?? ""} maxLength={80} placeholder="Acme Inc." />
      </Field>
      {result && <Alert tone={result.ok ? "success" : "error"}>{result.text}</Alert>}
      <Button type="submit" loading={pending}>
        Save
      </Button>
    </form>
  );
}
