// src/lib/security/origin-guard.ts
// Blocks requests from unauthorized origins and fires an email alert.
import { NextRequest, NextResponse } from "next/server";
import { notifyBlockedOrigin } from "@/lib/email";

const DEFAULT_ALLOWED = [
  "https://www.bejoby.com",
  "https://bejoby.com",
  "http://localhost:3000",
  "http://localhost:3001",
];

function getAllowedOrigins(): string[] {
  const env = (process.env.ALLOWED_ORIGINS || "").trim();
  const extra = env ? env.split(",").map((o) => o.trim()).filter(Boolean) : [];
  return [...DEFAULT_ALLOWED, ...extra];
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a 403 Response if the request origin is not in the allowlist,
 * and fires an async email alert to the admin team.
 * Returns null if the origin is allowed.
 */
export async function guardOrigin(
  req: NextRequest,
  path: string,
): Promise<NextResponse | null> {
  const origin = req.headers.get("origin") || "";

  // No origin header = server-to-server or same-origin — allow through.
  if (!origin) return null;

  const allowed = getAllowedOrigins();
  if (allowed.some((o) => origin === o || origin.startsWith(o))) return null;

  const ip = getClientIp(req);
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  // Fire alert without blocking the response path
  let bodySnippet: string | undefined;
  try {
    const clone = req.clone();
    const text = await clone.text();
    bodySnippet = text.slice(0, 500);
  } catch {
    // ignore
  }

  notifyBlockedOrigin({
    origin,
    ip,
    path,
    method: req.method,
    timestamp,
    body: bodySnippet,
  }).catch((e) => console.error("[origin-guard] alert failed:", e));

  return NextResponse.json(
    { message: "Origen no autorizado." },
    {
      status: 403,
      headers: { "X-Blocked-Reason": "unauthorized-origin" },
    },
  );
}
