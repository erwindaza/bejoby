import { NextResponse } from "next/server";
import { estimateCostPerCandidate } from "@/lib/services/ai-cost-service";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/candidates/:id/ai-cost
 * Returns estimated total AI cost for a candidate across all their applications.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET || "";

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID required" }, { status: 400 });
    }

    const totalCost = await estimateCostPerCandidate(candidateId);

    return NextResponse.json({
      ok: true,
      data: {
        candidate_id: candidateId,
        total_ai_cost_clp: totalCost,
        total_ai_cost_usd: totalCost / 800, // Approximate
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/candidates/:id/ai-cost]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to calculate AI cost" },
      { status: 500 }
    );
  }
}
