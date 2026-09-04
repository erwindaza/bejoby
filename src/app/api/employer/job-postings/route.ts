// GET /api/employer/job-postings — List employer's job postings
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jobs, applications } from "@/lib/gcp/collections";
import type { Query } from "@google-cloud/firestore";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Query job postings by employer
    let query: Query = jobs().where("employer_id", "==", user.employer_id);

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("created_at", "desc");

    const total = (await query.count().get()).data().count;
    const snapshot = await query.limit(limit).offset(offset).get();

    // Enrich with application counts
    const postings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const appCount = (
          await applications()
            .where("job_id", "==", doc.id)
            .count()
            .get()
        ).data().count;

        return {
          id: doc.id,
          ...doc.data(),
          application_count: appCount,
        };
      })
    );

    return NextResponse.json({
      postings,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[API] GET /employer/job-postings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
