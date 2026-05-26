"use client";

// shadcn-style mode toggle — a single button that swaps between light and
// dark via next-themes. Sun and Moon icons cross-fade in place using
// rotate + scale transforms so the swap reads as one motion. The button
// itself inherits the page's ink + cream palette so it sits naturally in
// the masthead without needing a Button primitive.
//
// SSR safety: the icons' visibility is controlled purely by the `dark:`
// Tailwind variant (which keys off the .dark class next-themes sets on
// <html> before first paint via its injected blocking script). The
// accessible name is a static "Toggle theme" so SSR and hydration paint
// the same DOM — passing a `resolvedTheme`-derived aria-label would
// produce a hydration mismatch because resolvedTheme is undefined on the
// server and only resolves after the client mounts.

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-rule)] text-[var(--color-ink-70)] transition-colors hover:bg-[var(--color-ink-5)] hover:text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink-40)]"
    >
      <Sun
        className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
    </button>
  );
}
