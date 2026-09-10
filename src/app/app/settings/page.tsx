import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardHeader } from "@/components/ui";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Account settings" };

export default async function SettingsPage() {
  const { profile } = await requireSession();
  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <PageHeader title="Account" />
      <Card>
        <CardHeader title="Profile" />
        <ProfileForm profile={profile} />
      </Card>
    </div>
  );
}
