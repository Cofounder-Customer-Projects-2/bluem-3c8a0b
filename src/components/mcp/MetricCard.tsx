import { clsx } from "clsx";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: number | string | null;
  sub?: string;
  accent?: boolean;
  icon?: ReactNode;
}

export function MetricCard({ label, value, sub, accent, icon }: MetricCardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-5 flex flex-col gap-2",
        accent
          ? "border-[var(--color-caret)]/30 bg-[var(--color-caret)]/5"
          : "border-[var(--color-rule)] bg-[var(--color-paper)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
          {label}
        </span>
        {icon ? <span className="text-[var(--color-ink-40)]">{icon}</span> : null}
      </div>
      <div
        className={clsx(
          "text-3xl font-semibold tabular-nums",
          accent ? "text-[var(--color-caret)]" : "text-[var(--color-ink)]",
        )}
      >
        {value ?? "—"}
      </div>
      {sub ? <p className="text-xs text-[var(--color-ink-50)]">{sub}</p> : null}
    </div>
  );
}
