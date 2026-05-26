import { Key } from "lucide-react";

export default function ApiKeysPage() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">API Keys</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          Programmatic access to the MCP Platform API.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-rule)]">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">API Reference</h2>
        </div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[var(--color-rule)] bg-[var(--color-ink-5)]">
              <th className="px-5 py-2.5 text-left text-[var(--color-ink-60)] font-medium">
                Method
              </th>
              <th className="px-4 py-2.5 text-left text-[var(--color-ink-60)] font-medium">Path</th>
              <th className="px-4 py-2.5 text-left text-[var(--color-ink-60)] font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-rule-soft)]">
            <tr>
              <td className="px-5 py-2.5 text-blue-600">GET</td>
              <td className="px-4 py-2.5">/api/mcp/servers</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                List registered servers
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-emerald-600">POST</td>
              <td className="px-4 py-2.5">/api/mcp/servers</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Register a new server
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-blue-600">GET</td>
              <td className="px-4 py-2.5">/api/mcp/servers/:id</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Get server details and tools
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-amber-600">PATCH</td>
              <td className="px-4 py-2.5">/api/mcp/servers/:id</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Update server status
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-blue-600">GET</td>
              <td className="px-4 py-2.5">/api/mcp/tasks</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                List tasks with filters
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-emerald-600">POST</td>
              <td className="px-4 py-2.5">/api/mcp/tasks</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Submit a new task
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-blue-600">GET</td>
              <td className="px-4 py-2.5">/api/mcp/tasks/:id</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Get task and result
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-amber-600">PATCH</td>
              <td className="px-4 py-2.5">/api/mcp/tasks/:id</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Review task result
              </td>
            </tr>
            <tr>
              <td className="px-5 py-2.5 text-blue-600">GET</td>
              <td className="px-4 py-2.5">/api/mcp/metrics</td>
              <td className="px-4 py-2.5 font-sans text-[var(--color-ink-50)]">
                Dashboard metrics
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] px-5 py-10 flex flex-col items-center text-center">
        <Key className="h-8 w-8 text-[var(--color-ink-20)] mb-3" />
        <p className="text-sm font-medium text-[var(--color-ink-60)]">
          Key management UI coming soon
        </p>
        <p className="text-xs text-[var(--color-ink-40)] mt-1">
          Issue, rotate, and revoke API keys with scope control.
        </p>
      </div>
    </div>
  );
}
