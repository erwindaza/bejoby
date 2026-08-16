import { NextResponse } from "next/server";
import { calculateRevenueInPeriod, countCommissionableCandidates } from "@/lib/services/partner-service";

/**
 * GET /api/admin/dashboard/revenue
 * Returns revenue metrics for the current month and monthly target tracking.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("x-admin-secret");
    const adminSecret = process.env.ADMIN_SECRET || "";

    if (!adminSecret || authHeader !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const revenue = await calculateRevenueInPeriod(monthStart, monthEnd);
    const commissionableCandidates = await countCommissionableCandidates(monthStart, monthEnd);

    const TARGET_REVENUE = 10000000; // 10M CLP
    const TARGET_CANDIDATES = 50;

    const revenueProgress = Math.min(100, Math.round((revenue / TARGET_REVENUE) * 100));
    const candidatesProgress = Math.min(100, Math.round((commissionableCandidates / TARGET_CANDIDATES) * 100));

    return NextResponse.json({
      ok: true,
      data: {
        month: monthStart.toISOString().slice(0, 7),
        revenue: {
          current_clp: revenue,
          target_clp: TARGET_REVENUE,
          progress_percent: revenueProgress,
          remaining_clp: Math.max(0, TARGET_REVENUE - revenue),
        },
        commissionable_candidates: {
          count: commissionableCandidates,
          target: TARGET_CANDIDATES,
          progress_percent: candidatesProgress,
          remaining: Math.max(0, TARGET_CANDIDATES - commissionableCandidates),
        },
        commission_per_candidate_clp: 200000,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard/revenue]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch revenue metrics" },
      { status: 500 }
    );
  }
}
