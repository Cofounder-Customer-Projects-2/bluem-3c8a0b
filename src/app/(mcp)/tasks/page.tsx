import { Plus } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { listTasks } from "@/lib/mcp/db";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ status?: string; server_id?: string; page?: string }>;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export default async function TasksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const status = sp.status as
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | undefined;

  const result = await listTasks({
    page,
    perPage: 25,
    status,
    serverId: sp.server_id,
  }).catch(() => ({ data: [], total: 0, page: 1, per_page: 25 }));

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Task Queue</h1>
          <p className="text-sm text-[var(--color-ink-60)] mt-1">
            {result.total} task{result.total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-caret)" }}
        >
          <Plus className="h-4 w-4" />
          Submit Task
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/tasks?status=${value}` : "/tasks"}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              (sp.status ?? "") === value
                ? "bg-[var(--color-caret)] text-white"
                : "bg-[var(--color-ink-10)] text-[var(--color-ink-70)] hover:bg-[var(--color-ink-20)]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-[var(--color-ink-5)]">
              <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Tool
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Submitted
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule-soft)]">
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <p className="text-sm text-[var(--color-ink-40)]">No tasks found</p>
                  <Link
                    href="/tasks/new"
                    className="inline-block mt-3 text-xs text-[var(--color-caret)] hover:underline"
                  >
                    Submit your first task →
                  </Link>
                </td>
              </tr>
            ) : (
              result.data.map((task) => (
                <tr key={task.id} className="hover:bg-[var(--color-ink-5)] transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/tasks/${task.id}`} className="block">
                      <span className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-caret)] transition-colors">
                        {task.title}
                      </span>
                      {task.server && (
                        <span className="block text-xs text-[var(--color-ink-50)] mt-0.5">
                          {task.server.name}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-[var(--color-ink-60)]">
                      {task.tool_name}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-[var(--color-ink-60)]">
                    {task.priority}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--color-ink-50)]">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.total > result.per_page && (
        <div className="flex items-center justify-between text-xs text-[var(--color-ink-50)]">
          <span>
            Showing {(page - 1) * result.per_page + 1}–
            {Math.min(page * result.per_page, result.total)} of {result.total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/tasks?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="px-3 py-1.5 rounded border border-[var(--color-rule)] hover:bg-[var(--color-ink-5)]"
              >
                Previous
              </Link>
            )}
            {page * result.per_page < result.total && (
              <Link
                href={`/tasks?page=${page + 1}${status ? `&status=${status}` : ""}`}
                className="px-3 py-1.5 rounded border border-[var(--color-rule)] hover:bg-[var(--color-ink-5)]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
