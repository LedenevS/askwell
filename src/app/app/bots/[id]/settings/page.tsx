import { requireBot } from "@/lib/bots";
import { getPlan } from "@/lib/plans";
import { BotSettingsForm } from "./BotSettingsForm";

export const metadata = { title: "Settings" };

export default async function BotSettingsPage({ params }: PageProps<"/app/bots/[id]/settings">) {
  const { id } = await params;
  const { bot, profile } = await requireBot(id);
  const plan = getPlan(profile.plan);
  return <BotSettingsForm bot={bot} canCustomizeInstructions={plan.limits.customInstructions} />;
}
