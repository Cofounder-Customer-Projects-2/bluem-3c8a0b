// MCP Platform — server-side data access layer
// All functions run with the service-role client via server actions / route handlers.
import { createClient } from "@supabase/supabase-js";
import type {
  McpDashboardMetrics,
  McpServer,
  McpTask,
  McpTaskResult,
  McpTool,
  PaginatedResponse,
  RegisterServerPayload,
  ReviewResultPayload,
  SubmitTaskPayload,
} from "./types";

function getServiceClient() {
  // Accept multiple env var names to support Cofounder runtime (GIC_SERVER_SUPABASE_URL)
  // and standard Next.js .env.local setups.
  const url =
    process.env.GIC_SERVER_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.GIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

// ── Servers ──────────────────────────────────────────────────────────────────

export async function listServers(opts: {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedResponse<McpServer>> {
  const supabase = getServiceClient();
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const from = (page - 1) * perPage;

  let query = supabase
    .from("mcp_servers")
    .select(
      `
      *,
      tool_count:mcp_tools(count),
      active_task_count:mcp_tasks(count)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.search) query = query.ilike("name", `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  // Flatten count subquery shapes
  const servers = (data ?? []).map((row) => ({
    ...row,
    tool_count: Array.isArray(row.tool_count) ? (row.tool_count[0]?.count ?? 0) : 0,
    active_task_count: Array.isArray(row.active_task_count)
      ? (row.active_task_count[0]?.count ?? 0)
      : 0,
  })) as McpServer[];

  return { data: servers, total: count ?? 0, page, per_page: perPage };
}

export async function getServer(id: string): Promise<McpServer | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("mcp_servers").select("*").eq("id", id).single();
  if (error) return null;
  return data as McpServer;
}

export async function registerServer(
  payload: RegisterServerPayload,
  ownerId?: string,
): Promise<McpServer> {
  const supabase = getServiceClient();
  const slug = payload.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("mcp_servers")
    .insert({
      name: payload.name,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      description: payload.description ?? null,
      endpoint_url: payload.endpoint_url ?? null,
      transport_type: payload.transport_type ?? "http",
      tags: payload.tags ?? [],
      owner_id: ownerId ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as McpServer;
}

export async function updateServerStatus(
  id: string,
  status: McpServer["status"],
  lastPingAt?: string,
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("mcp_servers")
    .update({ status, ...(lastPingAt ? { last_ping_at: lastPingAt } : {}) })
    .eq("id", id);
  if (error) throw error;
}

// ── Tools ────────────────────────────────────────────────────────────────────

export async function listToolsForServer(serverId: string): Promise<McpTool[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_tools")
    .select("*")
    .eq("server_id", serverId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as McpTool[];
}

export async function upsertTool(
  serverId: string,
  tool: Omit<McpTool, "id" | "server_id" | "created_at" | "updated_at">,
): Promise<McpTool> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_tools")
    .upsert({ ...tool, server_id: serverId }, { onConflict: "server_id,name" })
    .select()
    .single();
  if (error) throw error;
  return data as McpTool;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function listTasks(opts: {
  page?: number;
  perPage?: number;
  status?: string;
  serverId?: string;
  search?: string;
}): Promise<PaginatedResponse<McpTask>> {
  const supabase = getServiceClient();
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const from = (page - 1) * perPage;

  let query = supabase
    .from("mcp_tasks")
    .select(
      `
      *,
      server:mcp_servers(id, name, slug),
      tool:mcp_tools(id, name),
      result:mcp_task_results(*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (opts.status) query = query.eq("status", opts.status);
  if (opts.serverId) query = query.eq("server_id", opts.serverId);
  if (opts.search) query = query.ilike("title", `%${opts.search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  // result is a one-to-one but supabase returns it as array
  const tasks = (data ?? []).map((row) => ({
    ...row,
    result: Array.isArray(row.result) ? (row.result[0] ?? null) : row.result,
  })) as McpTask[];

  return { data: tasks, total: count ?? 0, page, per_page: perPage };
}

export async function getTask(id: string): Promise<McpTask | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_tasks")
    .select(
      `
      *,
      server:mcp_servers(id, name, slug),
      tool:mcp_tools(id, name),
      result:mcp_task_results(*)
    `,
    )
    .eq("id", id)
    .single();
  if (error) return null;
  const row = data as Record<string, unknown>;
  return {
    ...row,
    result: Array.isArray(row.result) ? (row.result[0] ?? null) : row.result,
  } as McpTask;
}

export async function submitTask(
  payload: SubmitTaskPayload,
  submittedBy?: string,
): Promise<McpTask> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_tasks")
    .insert({
      title: payload.title,
      server_id: payload.server_id,
      tool_id: payload.tool_id,
      tool_name: payload.tool_name,
      input_payload: payload.input_payload,
      priority: payload.priority ?? 5,
      submitted_by: submittedBy ?? null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as McpTask;
}

export async function updateTaskStatus(
  id: string,
  status: McpTask["status"],
  extra?: Partial<
    Pick<McpTask, "started_at" | "completed_at" | "error_message" | "assigned_agent_id">
  >,
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("mcp_tasks")
    .update({ status, ...(extra ?? {}) })
    .eq("id", id);
  if (error) throw error;
}

// ── Results ──────────────────────────────────────────────────────────────────

export async function createTaskResult(
  taskId: string,
  result: Partial<Omit<McpTaskResult, "id" | "task_id" | "created_at" | "updated_at">>,
): Promise<McpTaskResult> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_task_results")
    .upsert({ task_id: taskId, ...result }, { onConflict: "task_id" })
    .select()
    .single();
  if (error) throw error;
  return data as McpTaskResult;
}

export async function reviewTaskResult(
  taskId: string,
  payload: ReviewResultPayload,
  reviewedBy?: string,
): Promise<McpTaskResult> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("mcp_task_results")
    .update({
      review_status: payload.review_status,
      review_notes: payload.review_notes ?? null,
      reviewed_by: reviewedBy ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("task_id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data as McpTaskResult;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<McpDashboardMetrics> {
  const supabase = getServiceClient();

  const [servers, tasks, results] = await Promise.all([
    supabase.from("mcp_servers").select("status"),
    supabase.from("mcp_tasks").select("status"),
    supabase.from("mcp_task_results").select("review_status, execution_time_ms"),
  ]);

  const serverRows = servers.data ?? [];
  const taskRows = tasks.data ?? [];
  const resultRows = results.data ?? [];

  const execTimes = resultRows
    .map((r) => r.execution_time_ms)
    .filter((v): v is number => v !== null);

  return {
    total_servers: serverRows.length,
    active_servers: serverRows.filter((s) => s.status === "active").length,
    total_tasks: taskRows.length,
    pending_tasks: taskRows.filter((t) => t.status === "pending").length,
    running_tasks: taskRows.filter((t) => t.status === "running").length,
    completed_tasks: taskRows.filter((t) => t.status === "completed").length,
    failed_tasks: taskRows.filter((t) => t.status === "failed").length,
    tasks_pending_review: resultRows.filter((r) => r.review_status === "pending").length,
    approved_results: resultRows.filter((r) => r.review_status === "approved").length,
    avg_execution_ms:
      execTimes.length > 0
        ? Math.round(execTimes.reduce((a, b) => a + b, 0) / execTimes.length)
        : null,
  };
}
