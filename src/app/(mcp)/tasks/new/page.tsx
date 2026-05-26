"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    server_id: "",
    tool_id: "",
    tool_name: "",
    input_payload: "{}",
    priority: "5",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validatePayload(raw: string) {
    try {
      JSON.parse(raw);
      setPayloadError(null);
      return true;
    } catch {
      setPayloadError("Invalid JSON");
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePayload(form.input_payload)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcp/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          server_id: form.server_id,
          tool_id: form.tool_id,
          tool_name: form.tool_name,
          input_payload: JSON.parse(form.input_payload),
          priority: Number(form.priority),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to submit task");
      }
      const task = await res.json();
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-[var(--color-rule)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-30)] focus:outline-none focus:ring-2 focus:ring-[var(--color-caret)]/40";
  const labelClass = "block text-xs font-medium text-[var(--color-ink-60)] mb-1.5 cursor-pointer";

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-50)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to tasks
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Submit Task</h1>
        <p className="text-sm text-[var(--color-ink-60)] mt-1">
          Queue a tool invocation for an MCP server.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[var(--color-rule)] bg-[var(--color-paper)] p-6 space-y-5"
      >
        <div>
          <label htmlFor="t-title" className={labelClass}>
            Title
          </label>
          <input
            id="t-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Summarize Q3 reports"
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="t-server" className={labelClass}>
              Server ID
            </label>
            <input
              id="t-server"
              type="text"
              required
              value={form.server_id}
              onChange={(e) => set("server_id", e.target.value)}
              placeholder="UUID"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="t-tool" className={labelClass}>
              Tool ID
            </label>
            <input
              id="t-tool"
              type="text"
              required
              value={form.tool_id}
              onChange={(e) => set("tool_id", e.target.value)}
              placeholder="UUID"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="t-toolname" className={labelClass}>
              Tool Name
            </label>
            <input
              id="t-toolname"
              type="text"
              required
              value={form.tool_name}
              onChange={(e) => set("tool_name", e.target.value)}
              placeholder="e.g. summarize_document"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="t-priority" className={labelClass}>
              Priority (1–10)
            </label>
            <input
              id="t-priority"
              type="number"
              min={1}
              max={10}
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="t-payload" className={labelClass}>
            Input Payload (JSON)
          </label>
          <textarea
            id="t-payload"
            rows={6}
            value={form.input_payload}
            onChange={(e) => {
              set("input_payload", e.target.value);
              validatePayload(e.target.value);
            }}
            spellCheck={false}
            className={`${fieldClass} font-mono resize-none`}
          />
          {payloadError && <p className="text-xs text-red-500 mt-1">{payloadError}</p>}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || !!payloadError}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: "var(--color-caret)" }}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Submit Task
          </button>
          <Link
            href="/tasks"
            className="text-sm text-[var(--color-ink-50)] hover:text-[var(--color-ink)] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
