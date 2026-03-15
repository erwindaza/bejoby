// src/lib/utils/api-response.ts
// Standardized API response helpers
import { NextResponse } from "next/server";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function created<T>(data: T) {
  return success(data, 201);
}

export function error(message: string, status = 400, data?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...data }, { status });
}

export function serverError(message = "Internal server error") {
  return error(message, 500);
}

export function notFound(resource = "Resource") {
  return error(`${resource} not found`, 404);
}
