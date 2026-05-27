// GET  /api/mcp/servers/[id]/tools  — list tools from DB
// POST /api/mcp/servers/[id]/tools  — discover & sync tools from the live MCP server

import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/mcp/db";
import { listMcpTools } from "@/lib/mcp/executor";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getServiceClient();

  const { data: tools, error } = await db
    .from("mcp_tools")
    .select("*")
    .eq("server_id", id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }

  return NextResponse.json({ data: tools ?? [], total: tools?.length ?? 0 });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getServiceClient();

  const { data: server, error: serverErr } = await db
    .from("mcp_servers")
    .select("*")
    .eq("id", id)
    .single();

  if (serverErr || !server) {
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  try {
    const tools = await listMcpTools(
      (server.transport ?? "http") as "http" | "sse" | "stdio",
      server.endpoint_url ?? "",
      (server.config as Record<string, number>)?.timeout_ms ?? 15_000,
    );

    if (tools.length > 0) {
      const upserts = tools.map((tool: { name: string; description?: string; inputSchema?: Record<string, unknown> }) => ({
        server_id: id,
        name: tool.name,
        description: tool.description ?? null,
        input_schema: tool.inputSchema ?? {},
        output_schema: null,
        is_enabled: true,
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await db
        .from("mcp_tools")
        .upsert(upserts, { onConflict: "server_id,name" });

      if (upsertErr) console.error("[tools/discover] upsert error", upsertErr);
    }

    return NextResponse.json({
      discovered: tools.length,
      tools: tools.map((t: { name: string; description?: string }) => ({
        name: t.name,
        description: t.description,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Tool discovery failed", detail: message }, { status: 502 });
  }
}
