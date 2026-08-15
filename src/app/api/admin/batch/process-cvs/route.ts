import { NextResponse } from "next/server";
import { processPendingApplications } from "@/lib/batch/cv-processing";

/**
 * POST /api/admin/batch/process-cvs
 * Manually trigger batch CV processing.
 * Protected by admin secret header.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET || "";

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { maxPerBatch } = (await req.json().catch(() => ({} as Record<string, unknown>))) as {
      maxPerBatch?: number;
    };
    const result = await processPendingApplications(maxPerBatch || 10);

    return NextResponse.json({
      ok: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/admin/batch/process-cvs]", err);
    return NextResponse.json(
      { ok: false, error: "Batch processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/batch/process-cvs/status
 * Check the status of pending batch jobs.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET || "";

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Batch processing service operational",
      recommendation: "POST with maxPerBatch to trigger processing",
    });
  } catch (err) {
    console.error("[GET /api/admin/batch/process-cvs]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch batch status" },
      { status: 500 }
    );
  }
}
