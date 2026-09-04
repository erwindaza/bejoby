import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

vi.mock("@/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/gcp/collections", () => ({
  applications: vi.fn(),
  jobs: vi.fn(),
  interactions: vi.fn(),
}));

import { POST } from "../route";
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

function fakeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonRequest(body: unknown) {
  return new Request("http://x", { method: "POST", body: JSON.stringify(body) });
}

const sessionCandidate = { id: "candidate-1", email: "c1@x.com" };
const sessionEmployer = { id: "emp-1", email: "emp@x.com", employer_id: "employer-1" };

describe("POST /api/employer/applications/[id]/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-employer callers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionCandidate);
    const res = await POST(jsonRequest({ feedback: "great fit" }), fakeParams("app1"));
    expect(res.status).toBe(401);
  });

  it("rejects an empty payload (no feedback and no status)", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer);
    const res = await POST(jsonRequest({}), fakeParams("app1"));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid status value", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer);
    const res = await POST(jsonRequest({ status: "not-a-real-status" }), fakeParams("app1"));
    expect(res.status).toBe(400);
  });

  it("blocks feedback on an application belonging to another employer's job", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer);
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({ get: vi.fn(async () => docSnap(true, { job_id: "job-1" })), update: vi.fn() })
        ),
      })
    );
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { employer_id: "some-other-employer" })) })),
      })
    );
    const res = await POST(jsonRequest({ feedback: "great fit" }), fakeParams("app1"));
    expect(res.status).toBe(403);
  });

  it("updates status, appends history, and logs both a private note and a public status-change interaction", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionEmployer);
    const updateMock = vi.fn();
    vi.mocked(applications).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { job_id: "job-1" })), update: updateMock })),
      })
    );
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { employer_id: "employer-1" })) })),
      })
    );
    const addMock = vi.fn(async () => ({ id: "interaction-x" }));
    vi.mocked(interactions).mockReturnValue(asCollection({ add: addMock }));

    const res = await POST(
      jsonRequest({ feedback: "Strong candidate", status: "entrevista" }),
      fakeParams("app1")
    );
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "entrevista", feedback: "Strong candidate" })
    );
    // one private note + one public status-change interaction
    expect(addMock).toHaveBeenCalledTimes(2);
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "internal_note", is_public: false })
    );
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "status_change", is_public: true })
    );
  });
});
