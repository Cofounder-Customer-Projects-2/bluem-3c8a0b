import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { getTask } from "@/lib/mcp/db";
import { ReviewForm } from "./ReviewForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params;
  const task = await getTask(id).catch(() => null);
  if (!task) notFound();

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-50)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to tasks
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{task.title}</h1>
          <p className="text-xs text-[var(--color-ink-50)] font-mono mt-1">{task.id}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tool", value: task.tool_name },
          { label: "Server", value: task.server?.name ?? "—" },
          { label: "Priority", value: String(task.priority) },
          {
            label: "Retries",
            value: `${task.retry_count} / ${task.max_retries}`,
          },
          {
            label: "Submitted",
            value: new Date(task.created_at).toLocaleString(),
          },
          {
            label: "Started",
            value: task.started_at ? new Date(task.started_at).toLocaleString() : "—",
          },
          {
            label: "Completed",
            value: task.completed_at ? new Date(task.completed_at).toLocaleString() : "—",
          },
          {
            label: "Exec time",
            value:
              task.result?.execution_time_ms != null ? `${task.result.execution_time_ms}ms` : "—",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] px-4 py-3"
          >
            <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--color-ink-50)] mb-1">
              {label}
            </p>
            <p className="text-sm font-medium text-[var(--color-ink)] truncate font-mono">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Error message */}
      {task.error_message && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-5 py-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
            Error
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 font-mono">{task.error_message}</p>
        </div>
      )}

      {/* Two column: input + output */}
      <div className="grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-rule)]">
            <h2 className="text-xs font-semibold text-[var(--color-ink-60)] uppercase tracking-wider">
              Input Payload
            </h2>
          </div>
          <pre className="px-5 py-4 text-xs font-mono text-[var(--color-ink-80)] overflow-auto max-h-64 whitespace-pre-wrap break-all">
            {JSON.stringify(task.input_payload, null, 2)}
          </pre>
        </section>

        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-rule)] flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--color-ink-60)] uppercase tracking-wider">
              Output
            </h2>
            {task.result?.review_status && <StatusBadge status={task.result.review_status} />}
          </div>
          {task.result ? (
            <pre className="px-5 py-4 text-xs font-mono text-[var(--color-ink-80)] overflow-auto max-h-64 whitespace-pre-wrap break-all">
              {task.result.raw_output ?? JSON.stringify(task.result.output_payload, null, 2) ?? "—"}
            </pre>
          ) : (
            <p className="px-5 py-8 text-sm text-[var(--color-ink-40)] text-center">
              No output yet
            </p>
          )}
        </section>
      </div>

      {/* Review panel */}
      {task.status === "completed" && task.result && (
        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-rule)]">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Quality Review</h2>
          </div>
          <div className="p-5">
            <ReviewForm
              taskId={task.id}
              currentStatus={task.result.review_status}
              currentNotes={task.result.review_notes ?? undefined}
            />
          </div>
        </section>
      )}
    </div>
  );
}
