import { getSessionUser } from "@/lib/auth";
import { privacyRequests } from "@/lib/gcp/collections";
import { createPrivacyRequest } from "@/lib/compliance/privacy-requests";
import { createPrivacyRequestSchema } from "@/lib/validators/privacy-request";
import { success, created, error, serverError } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const snapshot = await privacyRequests()
      .where("user_id", "==", user.id)
      .orderBy("received_at", "desc")
      .get();

    return success(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    console.error("[GET /api/privacy/requests]", err);
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return error("Debes iniciar sesión", 401);

    const body = await req.json().catch(() => null);
    const parsed = createPrivacyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues.map((issue) => issue.message).join(", "));
    }

    const privacyRequest = await createPrivacyRequest({
      user_id: user.id,
      email: user.email,
      request_type: parsed.data.request_type,
      target: parsed.data.target,
      description: parsed.data.description,
      requested_blocking: parsed.data.requested_blocking,
      correction_payload: parsed.data.correction_payload,
    });

    return created(privacyRequest);
  } catch (err) {
    console.error("[POST /api/privacy/requests]", err);
    return serverError();
  }
}
