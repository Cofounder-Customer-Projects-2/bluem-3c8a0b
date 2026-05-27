// MCP API Key Authentication
// Validates Bearer tokens against the api_keys table.

import { getServiceClient } from "./db";

export interface AuthResult {
  valid: boolean;
  keyId?: string;
  scopes?: string[];
  error?: string;
}

/**
 * Validate an API key from an Authorization: Bearer header.
 * Keys are stored as sha256(key) in the DB; we compare prefix + hash.
 */
export async function validateApiKey(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or malformed Authorization header" };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return { valid: false, error: "Empty API key" };
  }

  // Key format: mcp_<prefix>_<secret>
  // We store the prefix and a sha256 hash of the full key.
  const prefix = rawKey.split("_").slice(0, 2).join("_"); // "mcp_<prefix>"

  try {
    const db = getServiceClient();

    // Find active keys matching this prefix
    const { data: keys, error } = await db
      .from("api_keys")
      .select("id, key_prefix, key_hash, scopes, is_active, expires_at")
      .eq("key_prefix", prefix)
      .eq("is_active", true)
      .limit(5);

    if (error) {
      console.error("[auth] DB error", error);
      return { valid: false, error: "Auth check failed" };
    }

    if (!keys || keys.length === 0) {
      return { valid: false, error: "Invalid API key" };
    }

    // Hash the incoming key and compare
    const hash = await sha256(rawKey);
    const match = keys.find((k) => {
      // Check expiry
      if (k.expires_at && new Date(k.expires_at) < new Date()) return false;
      return k.key_hash === hash;
    });

    if (!match) {
      return { valid: false, error: "Invalid API key" };
    }

    // Update last_used_at asynchronously (don't block response)
    db.from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", match.id)
      .then(() => {});

    return { valid: true, keyId: match.id, scopes: match.scopes ?? [] };
  } catch (err) {
    console.error("[auth] Unexpected error", err);
    return { valid: false, error: "Auth check failed" };
  }
}

async function sha256(message: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node.js fallback
  const { createHash } = await import("crypto");
  return createHash("sha256").update(message).digest("hex");
}

/**
 * Generate a new API key. Returns the raw key (shown once) and the data to store.
 */
export async function generateApiKey(name: string, scopes: string[] = ["tasks:write", "tasks:read"]) {
  const prefix = `mcp_${randomHex(8)}`;
  const secret = randomHex(32);
  const rawKey = `${prefix}_${secret}`;
  const hash = await sha256(rawKey);

  return {
    rawKey,        // show once to the user
    keyPrefix: prefix,
    keyHash: hash,
    name,
    scopes,
  };
}

function randomHex(bytes: number): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Node.js fallback
  const { randomBytes } = require("crypto");
  return randomBytes(bytes).toString("hex");
}
