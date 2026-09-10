import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Askwell — Turn your docs into a support assistant", template: "%s · Askwell" },
  description:
    "Upload your help docs, get an AI support assistant that answers with citations, embed it on your site, and learn which questions your docs can't answer yet.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Askwell — Turn your docs into a support assistant",
    description: "Upload docs. Get an assistant that cites sources. Embed it anywhere.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
