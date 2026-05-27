// MCP Task Worker — orchestrates task execution
// Runs as a serverless function triggered by Vercel Cron.
// Picks up pending tasks, calls the MCP server, stores results back.

import { pingMcpServer, listMcpTools, callMcpTool } from "./executor";
import { getServiceClient } from "./db";
import type { McpServer, McpTask } from "./types";

const WORKER_TIMEOUT_MS = 25_000; // stay under 30s Vercel limit
const MAX_TASKS_PER_RUN = 5;

export interface WorkerResult {
  processed: number;
  succeeded: number;
  failed: number;
  details: Array<{ taskId: string; status: "ok" | "error"; message: string }>;
}

// ── Task lifecycle helpers ────────────────────────────────────────────────────

async function claimTask(taskId: string): Promise<boolean> {
  const db = getServiceClient();
  const { error } = await db
    .from("mcp_tasks")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("status", "pending"); // optimistic lock — only claim if still pending
  return !error;
}

async function completeTask(
  taskId: string,
  outputPayload: Record<string, unknown>,
  rawOutput: string,
  executionTimeMs: number,
): Promise<void> {
  const db = getServiceClient();
  const now = new Date().toISOString();

  // Insert result row
  await db.from("mcp_task_results").insert({
    task_id: taskId,
    raw_output: outputPayload,      // jsonb column in DB
    text_content: rawOutput,        // text column in DB
    review_status: "pending",
    duration_ms: executionTimeMs,
  });

  // Update task status
  await db
    .from("mcp_tasks")
    .update({ status: "completed", completed_at: now, updated_at: now })
    .eq("id", taskId);
}

async function failTask(
  taskId: string,
  errorMessage: string,
  currentRetries: number,
  maxRetries: number,
): Promise<void> {
  const db = getServiceClient();
  const now = new Date().toISOString();
  const shouldRetry = currentRetries < maxRetries;

  await db
    .from("mcp_tasks")
    .update({
      status: shouldRetry ? "pending" : "failed",
      error_message: errorMessage,
      retry_count: currentRetries + 1,
      started_at: null,
      updated_at: now,
    })
    .eq("id", taskId);
}

// ── Ping helpers ──────────────────────────────────────────────────────────────

async function pingServer(server: McpServer): Promise<boolean> {
  const db = getServiceClient();
  try {
    const alive = await pingMcpServer(
      (server.transport ?? "http") as "http" | "sse" | "stdio",
      server.endpoint_url ?? "",
      5000,
    );
    await db
      .from("mcp_servers")
      .update({
        status: alive ? "active" : "error",
        last_ping_at: new Date().toISOString(),
        error_message: alive ? null : "Ping failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", server.id);
    return alive;
  } catch {
    await db
      .from("mcp_servers")
      .update({
        status: "error",
        last_ping_at: new Date().toISOString(),
        error_message: "Ping error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", server.id);
    return false;
  }
}

// ── Tool discovery ────────────────────────────────────────────────────────────

async function discoverTools(server: McpServer): Promise<void> {
  const db = getServiceClient();
  try {
    const tools = await listMcpTools(
      (server.transport ?? "http") as "http" | "sse" | "stdio",
      server.endpoint_url ?? "",
      10_000,
    );
    if (!tools.length) return;

    // Upsert tools — keyed by server_id + name
    for (const tool of tools) {
      await db.from("mcp_tools").upsert(
        {
          server_id: server.id,
          name: tool.name,
          description: tool.description ?? null,
          input_schema: tool.inputSchema ?? {},
          output_schema: null,
          is_enabled: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "server_id,name" },
      );
    }
  } catch {
    // non-fatal — best effort
  }
}

// ── Main worker ───────────────────────────────────────────────────────────────

export async function runWorker(): Promise<WorkerResult> {
  const db = getServiceClient();
  const agentId = `worker-${Date.now()}`;
  const deadline = Date.now() + WORKER_TIMEOUT_MS;
  const result: WorkerResult = { processed: 0, succeeded: 0, failed: 0, details: [] };

  // Fetch pending tasks ordered by priority desc, then created_at asc
  const { data: tasks, error } = await db
    .from("mcp_tasks")
    .select(`
      *,
      server:mcp_servers(id, name, slug, endpoint_url, transport, status, config),
      tool:mcp_tools(id, name, input_schema)
    `)
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(MAX_TASKS_PER_RUN);

  if (error || !tasks?.length) {
    return result;
  }

  for (const task of tasks as (McpTask & { server: McpServer })[]) {
    if (Date.now() > deadline) break;

    const taskStart = Date.now();
    const claimed = await claimTask(task.id);
    if (!claimed) continue; // another worker grabbed it

    result.processed++;

    try {
      const server = task.server as McpServer & {
        endpoint_url: string;
        transport: string;
        config: Record<string, unknown>;
      };

      if (!server?.endpoint_url) {
        throw new Error("Server has no endpoint URL configured");
      }

      const toolResult = await callMcpTool(
        server.transport as "http" | "sse" | "stdio",
        server.endpoint_url,
        { name: (task.tool as { name: string })?.name ?? task.tool_name, arguments: (task as unknown as Record<string, unknown>).input_args as Record<string, unknown> ?? {} },
        (server.config?.timeout_ms as number) ?? 20_000,
      );

      const executionTimeMs = Date.now() - taskStart;
      const rawOutput = JSON.stringify(toolResult.content);
      const outputPayload: Record<string, unknown> = {
        content: toolResult.content,
        isError: toolResult.isError ?? false,
      };

      await completeTask(task.id, outputPayload, rawOutput, executionTimeMs);
      result.succeeded++;
      result.details.push({ taskId: task.id, status: "ok", message: `Completed in ${executionTimeMs}ms` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await failTask(task.id, msg, task.retry_count ?? 0, task.max_retries ?? 3);
      result.failed++;
      result.details.push({ taskId: task.id, status: "error", message: msg });
    }
  }

  return result;
}

// ── Health sweep ──────────────────────────────────────────────────────────────

export async function runHealthSweep(): Promise<{ checked: number; alive: number }> {
  const db = getServiceClient();
  const { data: servers } = await db
    .from("mcp_servers")
    .select("*")
    .neq("status", "inactive")
    .neq("endpoint_url", null)
    .neq("transport", "stdio"); // skip stdio — can't ping remotely

  if (!servers?.length) return { checked: 0, alive: 0 };

  let alive = 0;
  await Promise.allSettled(
    servers.map(async (s) => {
      const ok = await pingServer(s as McpServer);
      if (ok) alive++;
    }),
  );

  return { checked: servers.length, alive };
}

// ── Tool sync sweep ───────────────────────────────────────────────────────────

export async function runToolSync(): Promise<void> {
  const db = getServiceClient();
  const { data: servers } = await db
    .from("mcp_servers")
    .select("*")
    .eq("status", "active")
    .neq("endpoint_url", null)
    .neq("transport", "stdio");

  if (!servers?.length) return;
  await Promise.allSettled(servers.map((s) => discoverTools(s as McpServer)));
}
