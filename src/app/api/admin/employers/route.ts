// src/app/api/admin/employers/route.ts
// Admin endpoint to list and verify/reject employer profiles.
// Protected by ADMIN_SECRET_TOKEN via Authorization header.

import { NextRequest, NextResponse } from "next/server";
import { employers } from "@/lib/gcp/collections";
import { isAdminRequest } from "@/lib/admin-auth";
import { FieldValue } from "@google-cloud/firestore";

const VALID_STATUSES = ["pending", "verified", "rejected"] as const;
type VerificationStatus = (typeof VALID_STATUSES)[number];

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function success(data: unknown) {
  return NextResponse.json({ ok: true, data });
}

// GET /api/admin/employers?status=pending — List employers
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return error("Unauthorized", 401);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as VerificationStatus | null;

    let query = employers().orderBy("created_at", "desc");
    if (status && VALID_STATUSES.includes(status)) {
      query = query.where("verification_status", "==", status);
    }

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return success(data);
  } catch (err) {
    console.error("[GET /api/admin/employers]", err);
    return error("Internal server error", 500);
  }
}

// POST /api/admin/employers — Update employer verification status
// Body: { id: string, verification_status: "pending" | "verified" | "rejected" }
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return error("Unauthorized", 401);
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id || !VALID_STATUSES.includes(body.verification_status)) {
      return error("Invalid request body");
    }

    await employers()
      .doc(body.id)
      .update({
        verification_status: body.verification_status,
        updated_at: FieldValue.serverTimestamp(),
      });

    return success({ id: body.id, verification_status: body.verification_status });
  } catch (err) {
    console.error("[POST /api/admin/employers]", err);
    return error("Internal server error", 500);
  }
}
