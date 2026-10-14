import type { Metadata } from "next";
import "./globals.css";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

export const metadata: Metadata = {
  title: "VentureIQ | Startup Financial & Unit Economics Simulator",
  description: "Model the business. Understand the trade-offs. Make better decisions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-brand-500 selection:text-white">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}

