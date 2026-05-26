"use client";

// Thin wrapper around next-themes' ThemeProvider — the standard shadcn
// pattern. Lives in the product template only because product surfaces
// (auth-gated app UI) typically benefit from light/dark switching, whereas
// marketing landings are usually light-only / brand-controlled.

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
