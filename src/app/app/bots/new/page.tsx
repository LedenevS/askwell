import { requireSession } from "@/lib/auth";
import { getUsage } from "@/lib/usage";
import { NewBotForm } from "./NewBotForm";

export const metadata = { title: "New assistant" };

export default async function NewBotPage() {
  const { profile } = await requireSession();
  const usage = await getUsage(profile);
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <NewBotForm canCreate={usage.botsUsed < usage.botsLimit} planName={usage.plan.name} botsLimit={usage.botsLimit} isFirst={usage.botsUsed === 0} />
    </div>
  );
}
