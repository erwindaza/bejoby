// GET /api/employer/export?type=applications|transactions&format=csv|json — Export data
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jobs, applications, transactions } from "@/lib/gcp/collections";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "applications";
    const format = url.searchParams.get("format") || "csv";
    const jobPostingId = url.searchParams.get("jobPostingId") || undefined;

    if (!["applications", "transactions"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    let rows: Record<string, unknown>[] = [];

    if (type === "applications") {
      const jobSnap = await jobs().where("employer_id", "==", user.employer_id).get();
      const jobIds = jobPostingId ? [jobPostingId] : jobSnap.docs.map((d) => d.id);
      const jobMap = new Map(jobSnap.docs.map((d) => [d.id, d.data()]));

      const chunks: string[][] = [];
      for (let i = 0; i < jobIds.length; i += 30) chunks.push(jobIds.slice(i, i + 30));

      for (const chunk of chunks) {
        if (chunk.length === 0) continue;
        const snap = await applications().where("job_id", "in", chunk).get();
        for (const doc of snap.docs) {
          const d = doc.data();
          rows.push({
            id: doc.id,
            job_id: d.job_id,
            job_title: jobMap.get(String(d.job_id))?.title || "",
            status: d.status,
            created_at: d.created_at?.toDate?.()?.toISOString() || "",
            updated_at: d.updated_at?.toDate?.()?.toISOString() || "",
          });
        }
      }
    } else {
      const snap = await transactions().where("employer_id", "==", user.employer_id).get();
      rows = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type,
          amount: d.amount,
          currency: d.currency,
          status: d.status,
          created_at: d.created_at?.toDate?.()?.toISOString() || "",
          completed_at: d.completed_at?.toDate?.()?.toISOString() || "",
          description: d.description || "",
        };
      });
    }

    if (format === "json") {
      return NextResponse.json({ rows, total: rows.length });
    }

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}-${Date.now()}.csv"`,
      },
    });
  } catch (err) {
    console.error("[API] GET /employer/export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
