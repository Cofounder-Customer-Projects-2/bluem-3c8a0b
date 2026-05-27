// POST /api/mcp/servers/[id]/ping
// Calls the MCP server's initialize method and updates health status.

import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/mcp/db";
import { initializeMcpServer } from "@/lib/mcp/executor";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getServiceClient();

  const { data: server, error } = await db
    .from("mcp_servers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  const start = Date.now();
  try {
    const initResult = await initializeMcpServer(
      (server.transport ?? "http") as "http" | "sse" | "stdio",
      server.endpoint_url ?? "",
      (server.config as Record<string, number>)?.timeout_ms ?? 10_000,
    );
    const latencyMs = Date.now() - start;

    await db
      .from("mcp_servers")
      .update({
        status: "active",
        last_ping_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ status: "ok", latency_ms: latencyMs, server_info: initResult });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await db
      .from("mcp_servers")
      .update({
        status: "error",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ status: "error", error: message }, { status: 502 });
  }
}
