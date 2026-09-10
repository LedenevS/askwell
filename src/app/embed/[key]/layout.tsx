export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh flex-col bg-white">{children}</div>;
}
