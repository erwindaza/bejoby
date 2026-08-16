/**
 * GET /api/candidates/:id/game-events
 * Get candidate's recent game events (achievements, progress, badges).
 * 
 * Returns: Array of game events sorted by most recent first
 */

import { getRecentGameEvents, calculateCurrentStreak } from "@/lib/services/game-events-service";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json(
        { ok: false, error: "Candidate ID required" },
        { status: 400 },
      );
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
    const events = await getRecentGameEvents(candidateId, limit);
    const streak = await calculateCurrentStreak(candidateId);

    return NextResponse.json({
      ok: true,
      data: {
        candidate_id: candidateId,
        total_events: events.length,
        current_streak_days: streak,
        recent_events: events,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[game-events]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 500 },
    );
  }
}
