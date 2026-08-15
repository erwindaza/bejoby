import { NextResponse } from "next/server";
import { submitCandidateToPartner } from "@/lib/services/partner-service";
import { getCandidateGameState } from "@/lib/services/candidate-game-service";

/**
 * POST /api/candidates/:id/submit-to-partner
 * Submit a candidate to a partner for a specific job.
 * Body: { partner_id, job_id }
 * Guards: candidate consent, profile completeness
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID required" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const { partner_id, job_id } = body as Record<string, unknown>;

    if (!partner_id || !job_id) {
      return NextResponse.json(
        { error: "partner_id and job_id are required" },
        { status: 400 }
      );
    }

    // Get game state to verify readiness
    const gameState = await getCandidateGameState(candidateId);
    if (!gameState) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    if (gameState.profile_completion < 80) {
      return NextResponse.json(
        {
          error: "Candidate profile is not complete enough",
          current_completion: gameState.profile_completion,
          required: 80,
        },
        { status: 400 }
      );
    }

    // Submit to partner
    const result = await submitCandidateToPartner(
      candidateId,
      String(partner_id),
      String(job_id),
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        application_id: result.application_id,
        submitted_at: new Date().toISOString(),
        message: "Candidato enviado exitosamente al partner",
      },
    });
  } catch (err) {
    console.error("[POST /api/candidates/:id/submit-to-partner]", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
