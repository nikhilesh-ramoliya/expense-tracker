import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-loaded",
});

export const metadata: Metadata = {
  title: {
    default: "Ledger — Expense Tracker",
    template: "%s",
  },
  description: "A phone-first spending ledger you can add to your iPhone Home Screen.",
  applicationName: "Ledger",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ledger",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f5d50",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <ServiceWorkerRegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
