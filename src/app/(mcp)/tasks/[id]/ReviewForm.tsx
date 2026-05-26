"use client";

import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { McpReviewStatus } from "@/lib/mcp/types";

const REVIEW_OPTIONS: { value: McpReviewStatus; label: string; color: string }[] = [
  {
    value: "approved",
    label: "Approve",
    color:
      "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60",
  },
  {
    value: "needs_revision",
    label: "Needs revision",
    color:
      "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100",
  },
  {
    value: "rejected",
    label: "Reject",
    color:
      "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100",
  },
];

interface Props {
  taskId: string;
  currentStatus: McpReviewStatus;
  currentNotes?: string;
}

export function ReviewForm({ taskId, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<McpReviewStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mcp/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: status, review_notes: notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        {REVIEW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={clsx(
              "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
              opt.color,
              status === opt.value ? "ring-2 ring-offset-1 ring-[var(--color-caret)]" : "",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label
          htmlFor="review-notes"
          className="block text-xs font-medium text-[var(--color-ink-60)] mb-1.5"
        >
          Review notes
        </label>
        <textarea
          id="review-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional notes about this result..."
          className="w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/40 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: "var(--color-caret)" }}
        >
          {loading ? "Saving…" : saved ? "Saved!" : "Save review"}
        </button>
        {currentStatus !== "pending" && (
          <span className="text-xs text-[var(--color-ink-50)]">Last reviewed: {currentStatus}</span>
        )}
      </div>
    </form>
  );
}
