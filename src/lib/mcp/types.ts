// MCP Platform — core domain types
// Mirrors the Scale AI pattern: registry → catalog → queue → review

export type McpServerStatus = "active" | "inactive" | "error" | "pending";
export type McpTaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type McpReviewStatus = "pending" | "approved" | "rejected" | "needs_revision";
export type McpTransportType = "stdio" | "sse" | "http";

// ── Servers ─────────────────────────────────────────────────────────────────

export interface McpServer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  endpoint_url: string | null;
  transport: McpTransportType;
  status: McpServerStatus;
  tags: string[];
  owner_id: string | null;
  metadata: Record<string, unknown>;
  last_ping_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  tool_count?: number;
  active_task_count?: number;
}

// ── Tools ────────────────────────────────────────────────────────────────────

export interface McpTool {
  id: string;
  server_id: string;
  name: string;
  description: string | null;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown> | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  // joined
  server?: Pick<McpServer, "id" | "name" | "slug" | "status">;
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export interface McpTask {
  id: string;
  title: string;
  server_id: string;
  tool_id: string;
  tool_name: string;
  input_payload: Record<string, unknown>;
  status: McpTaskStatus;
  priority: number;
  submitted_by: string | null;
  assigned_agent_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  server?: Pick<McpServer, "id" | "name" | "slug">;
  tool?: Pick<McpTool, "id" | "name">;
  result?: McpTaskResult;
}

// ── Results ──────────────────────────────────────────────────────────────────

export interface McpTaskResult {
  id: string;
  task_id: string;
  output_payload: Record<string, unknown> | null;
  raw_output: string | null;
  review_status: McpReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  execution_time_ms: number | null;
  token_usage: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ── API Keys ─────────────────────────────────────────────────────────────────

export interface McpApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  owner_id: string | null;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ── Dashboard metrics ────────────────────────────────────────────────────────

export interface McpDashboardMetrics {
  total_servers: number;
  active_servers: number;
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  tasks_pending_review: number;
  approved_results: number;
  avg_execution_ms: number | null;
}

// ── API shapes ───────────────────────────────────────────────────────────────

export interface RegisterServerPayload {
  name: string;
  description?: string;
  endpoint_url?: string;
  transport_type?: McpTransportType;
  tags?: string[];
}

export interface SubmitTaskPayload {
  title: string;
  server_id: string;
  tool_id: string;
  tool_name: string;
  input_payload: Record<string, unknown>;
  priority?: number;
}

export interface ReviewResultPayload {
  review_status: McpReviewStatus;
  review_notes?: string;
}

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
};
