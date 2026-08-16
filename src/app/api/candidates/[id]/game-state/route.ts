import { NextResponse } from "next/server";
import { getCandidateGameState } from "@/lib/services/candidate-game-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required." }, { status: 400 });
    }

    const gameState = await getCandidateGameState(candidateId);
    if (!gameState) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: gameState });
  } catch (error) {
    console.error("[GET /api/candidates/:id/game-state]", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo obtener el estado gamificado del candidato." },
      { status: 500 },
    );
  }
}
