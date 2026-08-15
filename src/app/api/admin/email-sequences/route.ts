// src/app/api/admin/email-sequences/route.ts — Admin API for cold email sequences
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSequence, processSequences } from "@/lib/services/email-sequence";
import { db } from "@/lib/gcp/firestore";

const ADMIN_SECRET = (process.env.ADMIN_SECRET || "").trim();

function verifyAdminSecret(req: NextRequest): boolean {
  const header = req.headers.get("x-admin-secret") || "";
  return header === ADMIN_SECRET && ADMIN_SECRET.length > 0;
}

// GET /api/admin/email-sequences — List active sequences
export async function GET(req: NextRequest) {
  if (!verifyAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await db()
      .collection("email_sequences")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();

    const sequences = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString(),
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString(),
      scheduled_next: doc.data().scheduled_next?.toDate?.()?.toISOString(),
    }));

    return NextResponse.json({ sequences, total: sequences.length });
  } catch (err) {
    console.error("[GET /api/admin/email-sequences]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/admin/email-sequences — Create sequence or process pending
export async function POST(req: NextRequest) {
  if (!verifyAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);

    // Process pending sequences
    if (body?.action === "process") {
      const result = await processSequences();
      return NextResponse.json({
        message: "Sequences processed",
        ...result,
      });
    }

    // Create new sequence
    const createSchema = z.object({
      to_email: z.string().email(),
      to_name: z.string().min(1),
      to_company: z.string().min(1),
    });

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const sequence = await createSequence(parsed.data.to_email, parsed.data.to_name, parsed.data.to_company);

    return NextResponse.json(
      {
        message: "Sequence created",
        sequence,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/email-sequences]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
