/**
 * GET /api/admin/budget/ai-status
 * Check current month's AI spending and budget status.
 * 
 * Returns:
 * - current_month_spend_usd: Amount spent this month
 * - monthly_limit_usd: Configured monthly limit
 * - percent_used: Percentage of budget consumed
 * - status: "ok" | "warning" | "exceeded"
 */

import { getCurrentMonthAISpendUsd } from "@/lib/services/ai-cost-service";
import { NextRequest, NextResponse } from "next/server";

const MONTHLY_AI_BUDGET_USD = process.env.MONTHLY_AI_BUDGET_USD || "100"; // Default $100/month

export async function GET(req: NextRequest) {
  try {
    // Auth via secret header
    const authHeader = req.headers.get("x-admin-secret");
    if (authHeader !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const limitUsd = parseFloat(MONTHLY_AI_BUDGET_USD);
    const currentSpendUsd = await getCurrentMonthAISpendUsd();
    const percentUsed = (currentSpendUsd / limitUsd) * 100;

    let status = "ok";
    if (percentUsed >= 100) {
      status = "exceeded";
    } else if (percentUsed >= 80) {
      status = "warning";
    }

    return NextResponse.json({
      ok: true,
      data: {
        current_month_spend_usd: Number(currentSpendUsd.toFixed(2)),
        monthly_limit_usd: limitUsd,
        percent_used: Number(percentUsed.toFixed(1)),
        remaining_usd: Number((limitUsd - currentSpendUsd).toFixed(2)),
        status,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[ai-budget-status]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Budget check failed" },
      { status: 500 },
    );
  }
}
