import { requireBot } from "@/lib/bots";
import { BotTabs } from "@/components/app/BotTabs";
import { Badge } from "@/components/ui";

export default async function BotLayout({ children, params }: LayoutProps<"/app/bots/[id]">) {
  const { id } = await params;
  const { bot } = await requireBot(id);

  return (
    <div>
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: bot.primary_color }}>
              {bot.name.slice(0, 1).toUpperCase()}
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">{bot.name}</h1>
            {bot.is_active ? <Badge tone="success">Live</Badge> : <Badge tone="warning">Paused</Badge>}
          </div>
          <BotTabs botId={bot.id} />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
