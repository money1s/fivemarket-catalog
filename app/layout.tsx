import type { Metadata, Viewport } from "next";
import "@fontsource/rubik/500.css";
import "@fontsource/rubik/700.css";
import "@fontsource/rubik/800.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import { PixelNoScript, PixelScripts } from "@/components/analytics/pixel-scripts";
import { AppShell } from "@/components/layout/app-shell";
import { getSiteUrl } from "@/lib/site";
import "@/app/globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FiveMarket - Насіння та саджанці",
    template: "%s | FiveMarket",
  },
  description: "Каталог насіння та саджанців українською. Швидке замовлення без зайвих кроків.",
  openGraph: {
    title: "FiveMarket - Насіння та саджанці",
    description: "Каталог насіння та саджанців українською. Швидке замовлення без зайвих кроків.",
    type: "website",
    locale: "uk_UA",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <PixelNoScript />
        <PixelScripts />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
        >
          Перейти до основного вмісту
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
