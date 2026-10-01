// src/lib/admin-auth.ts
// Minimal admin authentication via a secret token in the Authorization header.
// This is suitable for an MVP admin panel; replace with role-based auth as the team grows.

import { NextRequest } from "next/server";

const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;

export function isAdminRequest(req: NextRequest): boolean {
  if (!ADMIN_SECRET_TOKEN) {
    console.error("[admin-auth] ADMIN_SECRET_TOKEN is not configured");
    return false;
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return token === ADMIN_SECRET_TOKEN;
}
