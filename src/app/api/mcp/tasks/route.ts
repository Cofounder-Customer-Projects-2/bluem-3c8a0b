import { type NextRequest, NextResponse } from "next/server";
import { listTasks, submitTask } from "@/lib/mcp/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("per_page") ?? "20");
  const status = searchParams.get("status") as
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | null;
  const serverId = searchParams.get("server_id") ?? undefined;

  try {
    const result = await listTasks({
      page,
      perPage,
      status: status ?? undefined,
      serverId,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/mcp/tasks]", err);
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, server_id, tool_id, tool_name, input_payload, priority } = body;

    if (!title || !server_id || !tool_id || !tool_name) {
      return NextResponse.json(
        { error: "title, server_id, tool_id, and tool_name are required" },
        { status: 400 },
      );
    }

    const task = await submitTask({
      title,
      server_id,
      tool_id,
      tool_name,
      input_payload: input_payload ?? {},
      priority,
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[POST /api/mcp/tasks]", err);
    return NextResponse.json({ error: "Failed to submit task" }, { status: 500 });
  }
}
