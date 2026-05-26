import { Plus, Server } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/mcp/StatusBadge";
import { listServers } from "@/lib/mcp/db";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function ServersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");
  const status = sp.status as "active" | "inactive" | "error" | "pending" | undefined;

  const result = await listServers({ page, perPage: 20, status, search: sp.search }).catch(() => ({
    data: [],
    total: 0,
    page: 1,
    per_page: 20,
  }));

  const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "error", label: "Error" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Server Registry</h1>
          <p className="text-sm text-[var(--color-ink-60)] mt-1">
            {result.total} server{result.total !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Link
          href="/servers/register"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-caret)" }}
        >
          <Plus className="h-4 w-4" />
          Register Server
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/servers?status=${value}` : "/servers"}
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
                Server
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Transport
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Tools
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-60)] uppercase tracking-wider">
                Last ping
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule-soft)]">
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <Server className="h-8 w-8 text-[var(--color-ink-20)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--color-ink-40)]">No servers found</p>
                  <Link
                    href="/servers/register"
                    className="inline-block mt-3 text-xs text-[var(--color-caret)] hover:underline"
                  >
                    Register your first MCP server →
                  </Link>
                </td>
              </tr>
            ) : (
              result.data.map((server) => (
                <tr
                  key={server.id}
                  className="hover:bg-[var(--color-ink-5)] transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <Link href={`/servers/${server.id}`} className="block">
                      <span className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-caret)] transition-colors">
                        {server.name}
                      </span>
                      {server.description && (
                        <span className="block text-xs text-[var(--color-ink-50)] mt-0.5 truncate max-w-xs">
                          {server.description}
                        </span>
                      )}
                      {server.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {server.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-ink-10)] text-[var(--color-ink-60)] font-mono"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-[var(--color-ink-60)]">
                      {server.transport_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-[var(--color-ink-70)]">
                    {server.tool_count ?? 0}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={server.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--color-ink-50)]">
                    {server.last_ping_at ? new Date(server.last_ping_at).toLocaleString() : "Never"}
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
                href={`/servers?page=${page - 1}${status ? `&status=${status}` : ""}`}
                className="px-3 py-1.5 rounded border border-[var(--color-rule)] hover:bg-[var(--color-ink-5)]"
              >
                Previous
              </Link>
            )}
            {page * result.per_page < result.total && (
              <Link
                href={`/servers?page=${page + 1}${status ? `&status=${status}` : ""}`}
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
