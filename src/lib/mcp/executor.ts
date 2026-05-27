// MCP Executor — transport-layer client for MCP servers
// Speaks JSON-RPC 2.0 over HTTP and SSE transports.
// stdio transport is handled via an HTTP proxy pattern for serverless environments.

export type McpTransport = "http" | "sse" | "stdio";

export interface McpJsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpJsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface McpServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
    logging?: Record<string, unknown>;
  };
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

// ── JSON-RPC helpers ──────────────────────────────────────────────────────────

let _rpcId = 1;
function nextId() {
  return _rpcId++;
}

function makeRequest(method: string, params?: Record<string, unknown>): McpJsonRpcRequest {
  return { jsonrpc: "2.0", id: nextId(), method, params };
}

// ── HTTP transport ────────────────────────────────────────────────────────────

async function httpRpc(
  endpointUrl: string,
  request: McpJsonRpcRequest,
  timeoutMs = 30_000,
): Promise<McpJsonRpcResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json as McpJsonRpcResponse;
  } finally {
    clearTimeout(timer);
  }
}

// ── SSE transport ─────────────────────────────────────────────────────────────
// MCP SSE: client POSTs to the endpoint URL, server streams SSE events back.
// We collect the first `message` event and resolve.

async function sseRpc(
  endpointUrl: string,
  request: McpJsonRpcRequest,
  timeoutMs = 30_000,
): Promise<McpJsonRpcResponse> {
  // SSE MCP servers expose two endpoints:
  //   GET  /sse         → SSE stream (server → client)
  //   POST /messages    → client → server (receives over SSE)
  // For simplicity we try the POST-only pattern first (HTTP-over-SSE fallback),
  // then fall back to raw POST if the server responds with JSON directly.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`SSE HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("text/event-stream")) {
      // Read SSE stream until we get a message event
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newline
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const lines = event.split("\n");
          let data = "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              data += line.slice(6);
            }
          }
          if (data) {
            try {
              return JSON.parse(data) as McpJsonRpcResponse;
            } catch {
              // Not JSON, keep reading
            }
          }
        }
      }
      throw new Error("SSE stream ended without a valid JSON-RPC response");
    } else {
      // Server responded with plain JSON (common in dev servers)
      const json = await res.json();
      return json as McpJsonRpcResponse;
    }
  } finally {
    clearTimeout(timer);
  }
}

// ── Unified call ──────────────────────────────────────────────────────────────

async function rpc(
  transport: McpTransport,
  endpointUrl: string,
  method: string,
  params?: Record<string, unknown>,
  timeoutMs?: number,
): Promise<McpJsonRpcResponse> {
  const req = makeRequest(method, params);

  switch (transport) {
    case "http":
      return httpRpc(endpointUrl, req, timeoutMs);
    case "sse":
      return sseRpc(endpointUrl, req, timeoutMs);
    case "stdio":
      // stdio servers are not directly reachable from serverless.
      // Return a not-supported error so the task fails gracefully.
      return {
        jsonrpc: "2.0",
        id: req.id,
        error: {
          code: -32001,
          message:
            "stdio transport is not supported in serverless environments. " +
            "Register the server with an HTTP or SSE endpoint instead.",
        },
      };
    default:
      throw new Error(`Unknown transport: ${transport}`);
  }
}

function assertResult(res: McpJsonRpcResponse): unknown {
  if (res.error) {
    throw new Error(
      `MCP RPC error ${res.error.code}: ${res.error.message}` +
        (res.error.data ? ` — ${JSON.stringify(res.error.data)}` : ""),
    );
  }
  return res.result;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function initializeMcpServer(
  transport: McpTransport,
  endpointUrl: string,
  timeoutMs?: number,
): Promise<McpServerInfo> {
  const res = await rpc(
    transport,
    endpointUrl,
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: { roots: { listChanged: true } },
      clientInfo: { name: "mcp-platform", version: "1.0.0" },
    },
    timeoutMs,
  );
  return assertResult(res) as McpServerInfo;
}

export async function listMcpTools(
  transport: McpTransport,
  endpointUrl: string,
  timeoutMs?: number,
): Promise<McpToolDefinition[]> {
  const res = await rpc(transport, endpointUrl, "tools/list", undefined, timeoutMs);
  const result = assertResult(res) as { tools: McpToolDefinition[] };
  return result.tools ?? [];
}

export async function callMcpTool(
  transport: McpTransport,
  endpointUrl: string,
  toolCall: McpToolCall,
  timeoutMs?: number,
): Promise<McpToolResult> {
  const res = await rpc(
    transport,
    endpointUrl,
    "tools/call",
    { name: toolCall.name, arguments: toolCall.arguments },
    timeoutMs,
  );
  const result = assertResult(res) as McpToolResult;
  return result;
}

export async function pingMcpServer(
  transport: McpTransport,
  endpointUrl: string,
  timeoutMs = 5_000,
): Promise<boolean> {
  try {
    const res = await rpc(transport, endpointUrl, "ping", undefined, timeoutMs);
    // ping response is {} per spec; error means server is down
    return !res.error;
  } catch {
    return false;
  }
}
