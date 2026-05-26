"use client";

import { clsx } from "clsx";
import { Activity, CheckSquare, Database, Key, LayoutDashboard, Server } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/servers", label: "Servers", icon: Server },
  { href: "/tasks", label: "Task Queue", icon: Activity },
  { href: "/review", label: "Review", icon: CheckSquare },
  { href: "/datasets", label: "Datasets", icon: Database },
  { href: "/keys", label: "API Keys", icon: Key },
] as const;

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-[var(--color-caret)]/10 text-[var(--color-caret)] font-medium"
          : "text-[var(--color-ink-70)] hover:bg-[var(--color-ink-5)] hover:text-[var(--color-ink)]",
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

export default function McpLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[var(--color-rule)] bg-[var(--color-paper)] flex flex-col">
        {/* Logo / wordmark */}
        <div className="px-5 py-5 border-b border-[var(--color-rule)]">
          <div className="flex items-center gap-2.5">
            <span
              className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "var(--color-caret)" }}
            >
              M
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink)] leading-none">
                MCP Platform
              </p>
              <p className="text-[10px] text-[var(--color-ink-50)] mt-0.5">Tool Orchestration</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(({ href, label, icon }) => (
            <SidebarLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname === href || pathname.startsWith(`${href}/`)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--color-rule)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-ink-40)] font-mono">v0.1.0</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
