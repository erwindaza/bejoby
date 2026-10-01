import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

vi.mock("@/lib/gcp/collections", () => ({
  employers: vi.fn(),
  jobs: vi.fn(),
}));

vi.mock("@google-cloud/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "mock-timestamp"),
  },
}));

function asDoc(obj: unknown): DocumentReference {
  return obj as DocumentReference;
}
function asCollection(obj: unknown): CollectionReference {
  return obj as CollectionReference;
}

const envBackup = process.env.ADMIN_SECRET_TOKEN;

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = "admin-secret-123";
});

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = envBackup;
});

describe("GET /api/admin/employers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without token", async () => {
    const { GET } = await import("@/app/api/admin/employers/route");
    const res = await GET(new Request("http://localhost/api/admin/employers"));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 401 with invalid token", async () => {
    const { GET } = await import("@/app/api/admin/employers/route");
    const res = await GET(
      new Request("http://localhost/api/admin/employers", {
        headers: { authorization: "Bearer wrong-token" },
      })
    );
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("lists employers with valid token", async () => {
    const docs = [{ id: "emp-1", data: () => ({ company_name: "Acme", verification_status: "pending" }) }];
    const { employers } = await import("@/lib/gcp/collections");
    vi.mocked(employers).mockReturnValue(
      asCollection({
        orderBy: vi.fn(() => ({
          get: vi.fn(async () => ({ docs })),
        })),
      })
    );

    const { GET } = await import("@/app/api/admin/employers/route");
    const res = await GET(
      new Request("http://localhost/api/admin/employers", {
        headers: { authorization: "Bearer admin-secret-123" },
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(1);
  });
});

describe("POST /api/admin/employers", () => {
  it("updates verification status with valid token", async () => {
    const updateMock = vi.fn(async () => {});
    const { employers } = await import("@/lib/gcp/collections");
    vi.mocked(employers).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ update: updateMock })),
      })
    );

    const { POST } = await import("@/app/api/admin/employers/route");
    const res = await POST(
      new Request("http://localhost/api/admin/employers", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer admin-secret-123",
        },
        body: JSON.stringify({ id: "emp-1", verification_status: "verified" }),
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      verification_status: "verified",
      updated_at: "mock-timestamp",
    });
  });
});

describe("GET /api/admin/jobs", () => {
  it("lists pending_review jobs with valid token", async () => {
    const whereMock = vi.fn(() => ({
      get: vi.fn(async () => ({ docs: [] })),
    }));
    const { jobs } = await import("@/lib/gcp/collections");
    vi.mocked(jobs).mockReturnValue(
      asCollection({
        orderBy: vi.fn(() => ({ where: whereMock })),
      })
    );

    const { GET } = await import("@/app/api/admin/jobs/route");
    const res = await GET(
      new Request("http://localhost/api/admin/jobs?status=pending_review", {
        headers: { authorization: "Bearer admin-secret-123" },
      })
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(whereMock).toHaveBeenCalledWith("status", "==", "pending_review");
  });
});
