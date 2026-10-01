import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/gcp/collections", () => ({
  jobs: vi.fn(),
  users: vi.fn(),
  sessions: vi.fn(),
  candidates: vi.fn(),
  employers: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  notifyJobPosted: vi.fn(async () => {}),
}));

vi.mock("@google-cloud/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "mock-timestamp"),
  },
}));

import { GET, POST } from "@/app/api/jobs/route";
import { jobs, users, sessions, candidates, employers } from "@/lib/gcp/collections";
import { notifyJobPosted } from "@/lib/email";

function asDoc(obj: unknown): DocumentReference {
  return obj as DocumentReference;
}
function asCollection(obj: unknown): CollectionReference {
  return obj as CollectionReference;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function firstCallArg(mock: ReturnType<typeof vi.fn>): any {
  return mock.mock.calls[0]?.[0];
}
function docSnap(exists: boolean, data?: Record<string, unknown>) {
  return { exists, data: () => data };
}

const futureExpiry = new Date(Date.now() + 60_000);

describe("GET /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries only published jobs publicly", async () => {
    const whereMock = vi.fn(() => ({
      get: vi.fn(async () => ({ docs: [] })),
    }));
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        where: whereMock,
      })
    );

    const res = await GET(new Request("http://localhost/api/jobs?language=es"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(whereMock).toHaveBeenCalledWith("status", "==", "published");
  });
});

describe("POST /api/jobs", () => {
  const setMock = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
    setMock.mockClear();
    mockCookieGet.mockReturnValue({ value: "session-token" });

    vi.mocked(sessions).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { user_id: "user-1", expires_at: futureExpiry })),
          })
        ),
      })
    );

    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { email: "employer@example.com", employer_id: "emp-1" })),
          })
        ),
      })
    );

    vi.mocked(jobs).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ id: "job-123", set: setMock })),
      })
    );

    vi.mocked(employers).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { verification_status: "pending" })),
          })
        ),
      })
    );

    vi.mocked(candidates).mockReturnValue(
      asCollection({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(async () => ({ empty: true, docs: [] })),
          })),
        })),
      })
    );
  });

  it("returns 401 when user is not authenticated", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: "Dev", description: "Job", employer_id: "emp-1" }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 401 when user has no employer_id", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { email: "user@example.com" })),
          })
        ),
      })
    );

    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: "Dev", description: "Job", employer_id: "emp-1" }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 403 when employer_id does not match the user", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Dev",
          description: "Job",
          employment_type: "full-time",
          language: "es",
          employer_id: "emp-2",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.ok).toBe(false);
  });

  it("creates a pending_review job when employer is not verified", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Senior Developer",
          description: "Build things",
          location: "Remote",
          salary_range: "$100k",
          employment_type: "full-time",
          work_mode: "remote",
          language: "es",
          status: "published",
          employer_id: "emp-1",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe("job-123");
    expect(setMock).toHaveBeenCalled();
    expect(notifyJobPosted).toHaveBeenCalled();

    const payload = firstCallArg(setMock);
    expect(payload.title).toBe("Senior Developer");
    expect(payload.employer_id).toBe("emp-1");
    expect(payload.status).toBe("pending_review");
  });

  it("creates a published job when employer is verified", async () => {
    vi.mocked(employers).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { verification_status: "verified" })),
          })
        ),
      })
    );

    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Senior Developer",
          description: "Build things",
          employment_type: "full-time",
          work_mode: "remote",
          language: "es",
          status: "published",
          employer_id: "emp-1",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);

    const payload = firstCallArg(setMock);
    expect(payload.status).toBe("published");
  });

  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        body: JSON.stringify({ title: "", description: "", employer_id: "emp-1" }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
  });
});
