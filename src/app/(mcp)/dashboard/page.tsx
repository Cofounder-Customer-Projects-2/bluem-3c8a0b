import { Activity, ArrowRight, Server } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/mcp/MetricCard";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { getDashboardMetrics, listServers, listTasks } from "@/lib/mcp/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [metrics, recentTasks, servers] = await Promise.all([
    getDashboardMetrics().catch(() => null),
    listTasks({ page: 1, perPage: 8 }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      per_page: 8,
    })),
    listServers({ page: 1, perPage: 5 }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      per_page: 5,
    })),
  ]);

  const avgMs = metrics?.avg_execution_ms
    ? metrics.avg_execution_ms < 1000
      ? `${Math.round(metrics.avg_execution_ms)}ms`
      : `${(metrics.avg_execution_ms / 1000).toFixed(1)}s`
    : null;

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          MCP server health, task queue, and review queue at a glance.
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Active Servers"
          value={metrics?.active_servers ?? 0}
          sub={`of ${metrics?.total_servers ?? 0} registered`}
          accent
          icon={<Server className="h-4 w-4" />}
        />
        <MetricCard
          label="Pending Tasks"
          value={metrics?.pending_tasks ?? 0}
          sub="in queue"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard label="Running" value={metrics?.running_tasks ?? 0} sub="in-flight" />
        <MetricCard label="Avg Exec Time" value={avgMs ?? "—"} sub="completed tasks" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Completed" value={metrics?.completed_tasks ?? 0} />
        <MetricCard label="Failed" value={metrics?.failed_tasks ?? 0} />
        <MetricCard
          label="Pending Review"
          value={metrics?.tasks_pending_review ?? 0}
          sub="awaiting approval"
          accent={!!metrics?.tasks_pending_review}
        />
      </div>

      {/* Two-column: Recent tasks + Server health */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-rule)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Recent Tasks</h2>
            <Link
              href="/tasks"
              className="flex items-center gap-1 text-xs text-[var(--color-ink-50)] hover:text-[var(--color-caret)] transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-rule-soft)]">
            {recentTasks.data.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--color-ink-40)] text-center">
                No tasks yet
              </p>
            ) : (
              recentTasks.data.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-ink-5)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-50)] truncate mt-0.5">
                      {task.tool_name}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Server Health */}
        <section className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-rule)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Server Health</h2>
            <Link
              href="/servers"
              className="flex items-center gap-1 text-xs text-[var(--color-ink-50)] hover:text-[var(--color-caret)] transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[var(--color-rule-soft)]">
            {servers.data.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--color-ink-40)] text-center">
                No servers registered
              </p>
            ) : (
              servers.data.map((server) => (
                <Link
                  key={server.id}
                  href={`/servers/${server.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-ink-5)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {server.name}
                    </p>
                    <p className="text-xs text-[var(--color-ink-50)] font-mono truncate mt-0.5">
                      {server.transport_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {server.tool_count !== undefined && (
                      <span className="text-xs text-[var(--color-ink-40)]">
                        {server.tool_count} tools
                      </span>
                    )}
                    <StatusBadge status={server.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
