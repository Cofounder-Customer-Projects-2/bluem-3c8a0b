import { type NextRequest, NextResponse } from "next/server";
import { getTask, reviewTaskResult } from "@/lib/mcp/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const task = await getTask(id);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (err) {
    console.error("[GET /api/mcp/tasks/:id]", err);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { review_status, review_notes } = body;

    if (!review_status) {
      return NextResponse.json({ error: "review_status is required" }, { status: 400 });
    }

    const result = await reviewTaskResult(id, { review_status, review_notes });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[PATCH /api/mcp/tasks/:id]", err);
    return NextResponse.json({ error: "Failed to review task result" }, { status: 500 });
  }
}
