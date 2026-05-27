"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { McpTransportType } from "@/lib/mcp/types";

const TRANSPORT_OPTIONS: { value: McpTransportType; label: string; desc: string }[] = [
  { value: "stdio", label: "stdio", desc: "Standard in/out process — local tools" },
  { value: "sse", label: "SSE", desc: "Server-sent events over HTTP" },
  { value: "http", label: "HTTP", desc: "Streamable HTTP endpoint" },
];

export default function RegisterServerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    endpoint_url: "",
    transport: "stdio" as McpTransportType,
    tags: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          endpoint_url: form.endpoint_url || undefined,
          transport: form.transport,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to register server");
      }

      const server = await res.json();
      router.push(`/servers/${server.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/servers"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-50)] hover:text-[var(--color-ink)] transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to servers
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Register MCP Server</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          Add a new MCP server to the registry. Tools will be discovered automatically once
          connected.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="reg-name" className="block text-sm font-medium text-[var(--color-ink)]">
            Server name <span className="text-red-500">*</span>
          </label>
          <input
            id="reg-name"
            type="text"
            required
            placeholder="e.g. filesystem-tools, github-mcp"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/30 focus:border-[var(--color-caret)]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="reg-desc" className="block text-sm font-medium text-[var(--color-ink)]">
            Description
          </label>
          <textarea
            id="reg-desc"
            placeholder="What does this server do?"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/30 focus:border-[var(--color-caret)] resize-none"
          />
        </div>

        {/* Transport type */}
        <div className="space-y-2">
          <p className="block text-sm font-medium text-[var(--color-ink)]">Transport type</p>
          <div className="grid grid-cols-3 gap-3">
            {TRANSPORT_OPTIONS.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, transport: value }))}
                className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  form.transport === value
                    ? "border-[var(--color-caret)] bg-[var(--color-caret)]/5"
                    : "border-[var(--color-rule)] hover:border-[var(--color-ink-30)]"
                }`}
              >
                <p className="text-sm font-medium font-mono text-[var(--color-ink)]">{label}</p>
                <p className="text-xs text-[var(--color-ink-50)] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint URL */}
        <div className="space-y-1.5">
          <label htmlFor="reg-url" className="block text-sm font-medium text-[var(--color-ink)]">
            Endpoint URL
            <span className="ml-1.5 text-xs text-[var(--color-ink-40)] font-normal">
              (required for SSE/HTTP)
            </span>
          </label>
          <input
            id="reg-url"
            type="url"
            placeholder="https://my-server.example.com/mcp"
            value={form.endpoint_url}
            onChange={(e) => setForm((f) => ({ ...f, endpoint_url: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/30 focus:border-[var(--color-caret)]"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label htmlFor="reg-tags" className="block text-sm font-medium text-[var(--color-ink)]">
            Tags
            <span className="ml-1.5 text-xs text-[var(--color-ink-40)] font-normal">
              comma-separated
            </span>
          </label>
          <input
            id="reg-tags"
            type="text"
            placeholder="filesystem, search, github"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/30 focus:border-[var(--color-caret)]"
          />
        </div>

        {/* Error */}
        {error ? (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : null}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: "var(--color-caret)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Registering…" : "Register Server"}
          </button>
          <Link
            href="/servers"
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[var(--color-ink-70)] border border-[var(--color-rule)] hover:bg-[var(--color-ink-5)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
