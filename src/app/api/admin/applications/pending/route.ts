import { NextResponse } from "next/server";
import { applications } from "@/lib/gcp/collections";

/**
 * GET /api/admin/applications/pending
 * Returns applications pending batch processing or submission to partner.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET || "";

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch pending applications
    const pendingSnapshot = await applications()
      .where("batch_processing_status", "in", ["pending", "processing", "retry"])
      .limit(20)
      .get();

    const readyForSubmission = await applications()
      .where("ready_for_partner_submission", "==", true)
      .where("status", "!=", "submitted")
      .limit(20)
      .get();

    const pendingData = pendingSnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        candidate_name: data.candidate_name,
        status: data.batch_processing_status,
        retry_count: data.batch_processing_retry_count,
        error: data.batch_processing_last_error,
        cv_path: data.cv_path,
      };
    });

    const readyData = readyForSubmission.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        candidate_name: data.candidate_name,
        candidate_id: data.candidate_id,
        ai_analysis: data.ai_analysis,
      };
    });

    return NextResponse.json({
      ok: true,
      data: {
        pending_analysis: {
          count: pendingData.length,
          applications: pendingData,
        },
        ready_for_partner: {
          count: readyData.length,
          applications: readyData,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/applications/pending]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch pending applications" },
      { status: 500 }
    );
  }
}
