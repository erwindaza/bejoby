// src/app/api/jobs/route.ts
import { jobs, employers } from "@/lib/gcp/collections";
import { createJobSchema } from "@/lib/validators/job";
import { success, created, error, serverError } from "@/lib/utils/api-response";
import { FieldValue, Query } from "@google-cloud/firestore";
import { notifyJobPosted } from "@/lib/email";
import { getSessionUser } from "@/lib/auth";

// GET /api/jobs — Public job listing (only published jobs)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get("language");
    const employer_id = searchParams.get("employer_id");
    const work_mode = searchParams.get("work_mode");
    const employment_type = searchParams.get("employment_type");

    // Public endpoint: only published jobs are visible.
    // Employers must use GET /api/employer/job-postings to see their drafts/reviews.
    let query: Query = jobs().where("status", "==", "published");

    if (employer_id) query = query.where("employer_id", "==", employer_id);

    const snapshot = await query.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Client-side filtering (avoids Firestore composite index requirements)
    if (language) data = data.filter((d) => d.language === language);
    if (work_mode) data = data.filter((d) => d.work_mode === work_mode);
    if (employment_type) data = data.filter((d) => d.employment_type === employment_type);

    // Sort by created_at desc (newest first)
    data.sort((a, b) => {
      const ta = a.created_at?._seconds ?? 0;
      const tb = b.created_at?._seconds ?? 0;
      return tb - ta;
    });

    return success(data);
  } catch (err) {
    console.error("[GET /api/jobs]", err);
    return serverError();
  }
}

// POST /api/jobs — Create a new job
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user?.employer_id) return error("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "));
    }
    if (parsed.data.employer_id !== user.employer_id) return error("Forbidden", 403);

    // Determine visibility based on employer verification status.
    // Unverified employers can post, but jobs stay under review until BeJoby approves them.
    const employerDoc = await employers().doc(user.employer_id).get();
    const employer = employerDoc.data();
    const isVerified = employer?.verification_status === "verified";
    const effectiveStatus = isVerified ? parsed.data.status : "pending_review";

    const docRef = jobs().doc();
    const jobData = {
      ...parsed.data,
      status: effectiveStatus,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    await docRef.set(jobData);

    // Fire-and-forget email notification
    notifyJobPosted({ id: docRef.id, ...parsed.data, status: effectiveStatus }).catch(() => {});

    return created({ id: docRef.id, ...jobData });
  } catch (err) {
    console.error("[POST /api/jobs]", err);
    return serverError();
  }
}
