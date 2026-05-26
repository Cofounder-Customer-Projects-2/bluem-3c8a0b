import { CheckSquare } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { listTasks } from "@/lib/mcp/db";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  // Completed tasks with pending review
  const result = await listTasks({ page: 1, perPage: 50, status: "completed" }).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    per_page: 50,
  }));

  const pending = result.data.filter((t) => !t.result || t.result.review_status === "pending");
  const reviewed = result.data.filter((t) => t.result && t.result.review_status !== "pending");

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Quality Review</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          Review MCP tool outputs — approve, flag for revision, or reject.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pending review",
            value: pending.length,
            accent: pending.length > 0,
          },
          {
            label: "Reviewed",
            value: reviewed.length,
            accent: false,
          },
          {
            label: "Total completed",
            value: result.total,
            accent: false,
          },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className={`rounded-xl border p-5 ${
              accent
                ? "border-[var(--color-caret)]/30 bg-[var(--color-caret)]/5"
                : "border-[var(--color-rule)] bg-[var(--color-paper)]"
            }`}
          >
            <p className="text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
              {label}
            </p>
            <p
              className={`text-3xl font-semibold mt-2 tabular-nums ${
                accent ? "text-[var(--color-caret)]" : "text-[var(--color-ink)]"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending queue */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3">
          Pending Review ({pending.length})
        </h2>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          {pending.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <CheckSquare className="h-8 w-8 text-[var(--color-ink-20)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-ink-40)]">
                All caught up — no pending reviews
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-rule-soft)]">
              {pending.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-ink-5)] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] group-hover:text-[var(--color-caret)] transition-colors truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-50)] mt-0.5">
                      <span className="font-mono">{task.tool_name}</span>
                      {task.server && (
                        <span className="ml-2 text-[var(--color-ink-40)]">
                          · {task.server.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[var(--color-ink-40)]">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      Review →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recently reviewed */}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3">
            Recently Reviewed ({reviewed.length})
          </h2>
          <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
            <div className="divide-y divide-[var(--color-rule-soft)]">
              {reviewed.slice(0, 10).map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-ink-5)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-50)] font-mono mt-0.5">
                      {task.tool_name}
                    </p>
                  </div>
                  {task.result && <StatusBadge status={task.result.review_status} />}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
