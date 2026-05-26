import { type NextRequest, NextResponse } from "next/server";
import { listServers, registerServer } from "@/lib/mcp/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("per_page") ?? "20");
  const status = searchParams.get("status") as "active" | "inactive" | "error" | "pending" | null;
  const search = searchParams.get("search") ?? undefined;

  try {
    const result = await listServers({ page, perPage, status: status ?? undefined, search });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/mcp/servers]", err);
    return NextResponse.json({ error: "Failed to list servers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, endpoint_url, transport_type, tags } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const server = await registerServer({ name, description, endpoint_url, transport_type, tags });
    return NextResponse.json(server, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mcp/servers]", err);
    return NextResponse.json({ error: "Failed to register server" }, { status: 500 });
  }
}
