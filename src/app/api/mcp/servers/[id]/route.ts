import { type NextRequest, NextResponse } from "next/server";
import { getServer, updateServerStatus } from "@/lib/mcp/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const server = await getServer(id);
    if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(server);
  } catch (err) {
    console.error("[GET /api/mcp/servers/:id]", err);
    return NextResponse.json({ error: "Failed to fetch server" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });
    const server = await updateServerStatus(id, status);
    return NextResponse.json(server);
  } catch (err) {
    console.error("[PATCH /api/mcp/servers/:id]", err);
    return NextResponse.json({ error: "Failed to update server" }, { status: 500 });
  }
}
