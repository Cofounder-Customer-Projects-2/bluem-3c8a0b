import { clsx } from "clsx";
import type { McpReviewStatus, McpServerStatus, McpTaskStatus } from "@/lib/mcp/types";

type Status = McpServerStatus | McpTaskStatus | McpReviewStatus;

const CONFIG: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  // Server
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-500",
  },
  error: {
    label: "Error",
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  // Task
  running: {
    label: "Running",
    dot: "bg-blue-500 animate-pulse",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-500",
  },
  // Review
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
  },
  needs_revision: {
    label: "Needs revision",
    dot: "bg-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-700 dark:text-amber-400",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = CONFIG[status] ?? {
    label: status,
    dot: "bg-zinc-400",
    bg: "bg-zinc-100",
    text: "text-zinc-500",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
