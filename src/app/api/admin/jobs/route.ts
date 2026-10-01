// src/app/api/admin/jobs/route.ts
// Admin endpoint to list and approve/reject job postings.
// Protected by ADMIN_SECRET_TOKEN via Authorization header.

import { NextRequest, NextResponse } from "next/server";
import { jobs } from "@/lib/gcp/collections";
import { isAdminRequest } from "@/lib/admin-auth";
import { FieldValue } from "@google-cloud/firestore";

const VALID_STATUSES = ["draft", "pending_review", "published", "closed"] as const;
type JobStatus = (typeof VALID_STATUSES)[number];

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function success(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

// GET /api/admin/jobs?status=pending_review — List jobs
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return error("Unauthorized", 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as JobStatus | null;

    let query = jobs().orderBy("created_at", "desc");
    if (status && VALID_STATUSES.includes(status)) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return success(data);
  } catch (err) {
    console.error("[GET /api/admin/jobs]", err);
    return error("Internal server error", 500);
  }
}

// POST /api/admin/jobs — Update job status
// Body: { id: string, status: "draft" | "pending_review" | "published" | "closed" }
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return error("Unauthorized", 401);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id || !VALID_STATUSES.includes(body.status)) {
      return error("Invalid request body");
    }

    await jobs()
      .doc(body.id)
      .update({
        status: body.status,
        updated_at: FieldValue.serverTimestamp(),
      });

    return success({ id: body.id, status: body.status });
  } catch (err) {
    console.error("[POST /api/admin/jobs]", err);
    return error("Internal server error", 500);
  }
}
