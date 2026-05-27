// GET  /api/mcp/keys — list API keys (prefix only, never raw)
// POST /api/mcp/keys — create a new API key (raw key shown once)

import { type NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/mcp/db";
import { generateApiKey } from "@/lib/mcp/auth";

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("api_keys")
    .select("id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, scopes, expires_at } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const generated = await generateApiKey(
      name,
      scopes ?? ["tasks:read", "tasks:write"],
    );

    const db = getServiceClient();
    const { data, error } = await db
      .from("api_keys")
      .insert({
        name: generated.name,
        key_prefix: generated.keyPrefix,
        key_hash: generated.keyHash,
        scopes: generated.scopes,
        is_active: true,
        expires_at: expires_at ?? null,
      })
      .select("id, name, key_prefix, scopes, is_active, expires_at, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
    }

    return NextResponse.json(
      {
        ...data,
        // Raw key shown ONCE — client must store it securely
        raw_key: generated.rawKey,
        warning: "Store this key securely — it will not be shown again.",
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await db
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }

  return NextResponse.json({ revoked: true });
}
