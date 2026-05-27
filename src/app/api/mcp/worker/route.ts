// POST /api/mcp/worker
// Triggered by Vercel Cron (every 30s) and also callable manually.
// Protected by WORKER_SECRET env var.

import { type NextRequest, NextResponse } from "next/server";
import { runWorker } from "@/lib/mcp/worker";

export const maxDuration = 30; // Vercel max for hobby/pro

export async function POST(req: NextRequest) {
  // Authenticate via shared secret (set WORKER_SECRET in Vercel env vars)
  const workerSecret = process.env.WORKER_SECRET;
  if (workerSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  try {
    const result = await runWorker();
    return NextResponse.json({
      ...result,
      duration_ms: Date.now() - start,
    });
  } catch (err) {
    console.error("[worker] Fatal error", err);
    return NextResponse.json(
      { error: "Worker cycle failed", detail: String(err) },
      { status: 500 },
    );
  }
}

// Allow GET for health checks (no secret required)
export async function GET() {
  return NextResponse.json({ status: "ok", worker: "mcp-task-worker" });
}
