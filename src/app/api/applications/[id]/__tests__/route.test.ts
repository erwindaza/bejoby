import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/gcp/collections", () => ({
  applications: vi.fn(),
  jobs: vi.fn(),
  interactions: vi.fn(),
}));
vi.mock("@/lib/security/pii", () => ({
  buildEmployerSafeApplicationView: vi.fn((id: string, data: Record<string, unknown>) => ({
    id,
    ...data,
    candidate_email_masked: "m***@example.com",
  })),
  decryptApplicationPII: vi.fn((d: Record<string, unknown>) => d),
}));
vi.mock("@/lib/ai/match-analysis", () => ({ analyzeApplication: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendAnalysisReport: vi.fn(), sendToAddress: vi.fn() }));

import { GET } from "../route";
import { getSessionUser } from "@/lib/auth";
import { applications, jobs, interactions } from "@/lib/gcp/collections";

function docSnap(exists: boolean, data?: Record<string, unknown>) {
  return { exists, data: () => data };
}

function asDoc(obj: unknown): DocumentReference {
  return obj as DocumentReference;
}

function asCollection(obj: unknown): CollectionReference {
  return obj as CollectionReference;
}

function queryResult(docs: Array<{ id: string; data: () => Record<string, unknown> }>) {
  const q = {
    where: vi.fn(() => q),
    orderBy: vi.fn(() => q),
    get: vi.fn(async () => ({ docs })),
  };
  return asCollection(q);
}

function fakeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const sessionCandidate1 = { id: "candidate-1", email: "a@a.com" };
const sessionCandidate2 = { id: "candidate-2", email: "b@b.com" };
const sessionEmployer1 = { id: "emp-user-1", email: "e@e.com", employer_id: "emp-1" };

describe("GET /api/applications/[id] — access control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when application does not exist", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate1);
    vi.mocked(applications).mockReturnValue(
      asCollection({ doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(false)) })) })
    );
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when a candidate requests another candidate's application", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate2);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({ get: vi.fn(async () => docSnap(true, { candidate_id: "candidate-1", job_id: "job-1" })) })
        ),
      })
    );
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(403);
  });

  it("returns 403 when an employer requests an application to a job they don't own", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer1);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({ get: vi.fn(async () => docSnap(true, { candidate_id: "candidate-1", job_id: "job-1" })) })
        ),
      })
    );
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { employer_id: "some-other-employer" })) })),
      })
    );
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(403);
  });

  it("lets the owning candidate see their application and only public interactions", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate1);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { candidate_id: "candidate-1", job_id: "job-1", status: "pending" })),
          })
        ),
      })
    );
    vi.mocked(interactions).mockReturnValue(
      queryResult([
        { id: "i1", data: () => ({ body: "public msg", is_public: true }) },
        { id: "i2", data: () => ({ body: "private note", is_public: false }) },
      ])
    );
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.interactions).toHaveLength(1);
    expect(body.data.interactions[0].id).toBe("i1");
  });

  it("lets the owning employer see the application (sanitized) and all interactions", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer1);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { candidate_id: "candidate-1", job_id: "job-1", status: "pending" })),
          })
        ),
      })
    );
    vi.mocked(jobs).mockReturnValue(
      asCollection({ doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { employer_id: "emp-1" })) })) })
    );
    vi.mocked(interactions).mockReturnValue(
      queryResult([
        { id: "i1", data: () => ({ body: "public msg", is_public: true }) },
        { id: "i2", data: () => ({ body: "private note", is_public: false }) },
      ])
    );
    const res = await GET(new Request("http://x"), fakeParams("app1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.interactions).toHaveLength(2);
    expect(body.data.application.candidate_email_masked).toBe("m***@example.com");
  });
});
