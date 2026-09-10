import { requireBot, appUrl } from "@/lib/bots";
import { getPlan } from "@/lib/plans";
import { WidgetSetup } from "./WidgetSetup";

export const metadata = { title: "Widget" };

export default async function WidgetPage({ params }: PageProps<"/app/bots/[id]/widget">) {
  const { id } = await params;
  const { bot, profile } = await requireBot(id);
  const plan = getPlan(profile.plan);
  return (
    <WidgetSetup
      bot={bot}
      appUrl={appUrl()}
      canRestrictOrigins={plan.limits.allowedOrigins}
      showBranding={!plan.limits.removeBranding}
      planName={plan.name}
    />
  );
}
