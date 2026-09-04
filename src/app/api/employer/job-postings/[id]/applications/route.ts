// GET /api/employer/job-postings/[id]/applications — List applications for a job
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jobs, applications } from "@/lib/gcp/collections";
import type { Query } from "@google-cloud/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;

    // Verify job belongs to this employer
    const jobDoc = await jobs().doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();
    if (jobData?.employer_id !== user.employer_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Query applications for this job
    let query: Query = applications().where("job_id", "==", jobId);

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("created_at", "desc");

    const total = (await query.count().get()).data().count;
    const snapshot = await query.limit(limit).offset(offset).get();

    const apps = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        candidate_id: data.candidate_id,
        job_id: data.job_id,
        status: data.status || "pending",
        created_at: data.created_at,
        updated_at: data.updated_at,
        cv_path: data.cv_path,
      };
    });

    return NextResponse.json({
      applications: apps,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[API] GET /employer/job-postings/[id]/applications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
