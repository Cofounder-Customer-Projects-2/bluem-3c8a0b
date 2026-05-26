import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/mcp/db";

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (err) {
    console.error("[GET /api/mcp/metrics]", err);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
