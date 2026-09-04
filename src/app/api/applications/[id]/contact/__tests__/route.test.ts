import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/gcp/collections", () => ({
  applications: vi.fn(),
  jobs: vi.fn(),
  employers: vi.fn(),
  interactions: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendToAddress: vi.fn(async () => true) }));

import { POST } from "../route";
import { getSessionUser } from "@/lib/auth";
import { applications, jobs, employers, interactions } from "@/lib/gcp/collections";
import { sendToAddress } from "@/lib/email";

function docSnap(exists: boolean, data?: Record<string, unknown>) {
  return { exists, data: () => data };
}

function asDoc(obj: unknown): DocumentReference {
  return obj as DocumentReference;
}

function asCollection(obj: unknown): CollectionReference {
  return obj as CollectionReference;
}

function fakeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(body: unknown) {
  return new Request("http://x", { method: "POST", body: JSON.stringify(body) });
}

const sessionEmployer = { id: "emp-1", email: "emp@x.com", employer_id: "employer-1" };
const sessionCandidate1 = { id: "candidate-1", email: "c1@x.com" };
const sessionCandidate2 = { id: "candidate-2", email: "c2@x.com" };

describe("POST /api/applications/[id]/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects employer callers (only candidates can use this endpoint)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer);
    const res = await POST(jsonRequest({ message: "hi" }), fakeParams("app1"));
    expect(res.status).toBe(401);
  });

  it("rejects an empty message", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate1);
    const res = await POST(jsonRequest({ message: "" }), fakeParams("app1"));
    expect(res.status).toBe(400);
  });

  it("blocks contact when application is in a closed status", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate1);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () =>
              docSnap(true, { candidate_id: "candidate-1", job_id: "job-1", status: "rechazo" })
            ),
          })
        ),
      })
    );
    const res = await POST(jsonRequest({ message: "hola" }), fakeParams("app1"));
    expect(res.status).toBe(409);
  });

  it("rejects candidates messaging someone else's application", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate2);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () =>
              docSnap(true, { candidate_id: "candidate-1", job_id: "job-1", status: "enviada" })
            ),
          })
        ),
      })
    );
    const res = await POST(jsonRequest({ message: "hola" }), fakeParams("app1"));
    expect(res.status).toBe(403);
  });

  it("logs the interaction and emails the employer on success", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate1);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () =>
              docSnap(true, { candidate_id: "candidate-1", job_id: "job-1", status: "enviada" })
            ),
          })
        ),
      })
    );
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({ get: vi.fn(async () => docSnap(true, { employer_id: "employer-1", title: "Backend Dev" })) })
        ),
      })
    );
    vi.mocked(employers).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { email: "employer@company.com" })) })),
      })
    );
    const addMock = vi.fn(async () => ({ id: "interaction-1" }));
    vi.mocked(interactions).mockReturnValue(asCollection({ add: addMock }));

    const res = await POST(jsonRequest({ message: "Estoy interesado" }), fakeParams("app1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.interactionId).toBe("interaction-1");
    expect(body.data.emailSent).toBe(true);
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ application_id: "app1", is_public: true })
    );
    expect(sendToAddress).toHaveBeenCalledWith(
      "employer@company.com",
      expect.any(String),
      expect.any(String)
    );
  });
});
