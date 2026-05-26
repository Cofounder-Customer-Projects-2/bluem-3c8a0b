import { ArrowLeft, Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { getServer, listTasks, listToolsForServer } from "@/lib/mcp/db";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServerDetailPage({ params }: Props) {
  const { id } = await params;
  const [server, tools, tasks] = await Promise.all([
    getServer(id).catch(() => null),
    listToolsForServer(id).catch(() => []),
    listTasks({ page: 1, perPage: 10, serverId: id }).catch(() => ({
      data: [],
      total: 0,
      page: 1,
      per_page: 10,
    })),
  ]);

  if (!server) notFound();

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/servers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-50)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to servers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{server.name}</h1>
            <StatusBadge status={server.status} />
          </div>
          {server.description && (
            <p className="text-sm text-[var(--color-ink-60)] mt-2">{server.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-ink-50)]">
            <span>
              Transport:{" "}
              <code className="font-mono text-[var(--color-ink-70)]">{server.transport_type}</code>
            </span>
            {server.endpoint_url && (
              <span>
                Endpoint:{" "}
                <code className="font-mono text-[var(--color-ink-70)]">{server.endpoint_url}</code>
              </span>
            )}
            <span>
              Registered:{" "}
              {new Date(server.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {server.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {server.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] bg-[var(--color-ink-10)] text-[var(--color-ink-60)] font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={`/tasks/new?server_id=${server.id}`}
          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-caret)" }}
        >
          <Plus className="h-4 w-4" />
          Submit Task
        </Link>
      </div>

      {/* Tools Catalog */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Tools ({tools.length})
          </h2>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          {tools.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Wrench className="h-7 w-7 text-[var(--color-ink-20)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-ink-40)]">No tools registered</p>
              <p className="text-xs text-[var(--color-ink-30)] mt-1">
                Tools are discovered automatically when the server pings.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-rule)] bg-[var(--color-ink-5)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-rule-soft)]">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-[var(--color-ink-5)] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-medium text-[var(--color-ink)]">
                        {tool.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--color-ink-60)] max-w-sm">
                      {tool.description ?? (
                        <span className="text-[var(--color-ink-30)] italic">No description</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs font-medium ${tool.is_enabled ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-ink-40)]"}`}
                      >
                        {tool.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Recent Tasks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-ink)]">
            Recent Tasks ({tasks.total})
          </h2>
          <Link
            href={`/tasks?server_id=${server.id}`}
            className="text-xs text-[var(--color-ink-50)] hover:text-[var(--color-caret)] transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
          {tasks.data.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[var(--color-ink-40)] text-center">
              No tasks yet for this server
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-rule-soft)]">
              {tasks.data.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-ink-5)] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-50)] font-mono truncate mt-0.5">
                      {task.tool_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-[var(--color-ink-40)]">
                      {new Date(task.created_at).toLocaleString()}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
