import type { Metadata } from "next";
import { Figtree, Pixelify_Sans } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Display: Pixelify Sans (Google Fonts) — interim pixel-aesthetic display
// font; a follow-up PR will swap to Departure Mono once the provisioning
// service supports binary assets. Body: Figtree (Google Fonts). Mirrors
// the base template's font wiring.
const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify-sans",
  weight: ["400"],
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Day one — Cofounder",
  description:
    "Your product is wired. Cofounder provisioned a Next.js product app in your name with auth, payments, and email pre-wired.",
};

// suppressHydrationWarning on <html> is required by next-themes — the
// ThemeProvider sets the dark/light class on first paint, which would
// otherwise trip React's hydration mismatch warning.
export default function RootLayout({ children }: { children: ReactNode }) {
  const isPreviewEnvironment =
    process.env.NODE_ENV !== "development" &&
    (process.env.VERCEL_TARGET_ENV === "preview" || process.env.VERCEL_ENV === "preview");

  return (
    <html
      lang="en"
      className={`${pixelifySans.variable} ${figtree.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">
        {isPreviewEnvironment ? (
          <Script src="https://app.cofounder.co/agentation/widget.js" strategy="afterInteractive" />
        ) : null}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
