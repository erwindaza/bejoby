import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/gcp/collections", () => ({
  employers: vi.fn(),
  users: vi.fn(),
  sessions: vi.fn(),
  candidates: vi.fn(),
}));

vi.mock("@google-cloud/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "mock-timestamp"),
  },
}));

import { GET, POST } from "@/app/api/employers/route";
import { employers, users, sessions, candidates } from "@/lib/gcp/collections";

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

describe("GET /api/employers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists employers ordered by created_at", async () => {
    const docs = [
      { id: "emp-1", data: () => ({ company_name: "A" }) },
      { id: "emp-2", data: () => ({ company_name: "B" }) },
    ];
    vi.mocked(employers).mockReturnValue(
      asCollection({
        orderBy: vi.fn(() => ({
          get: vi.fn(async () => ({ docs })),
        })),
      })
    );

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].company_name).toBe("A");
  });
});

describe("POST /api/employers", () => {
  const setMock = vi.fn(async () => {});
  const updateMock = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
    setMock.mockClear();
    updateMock.mockClear();
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

    vi.mocked(employers).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ id: "emp-123", set: setMock })),
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

    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { email: "employer@example.com" })),
            update: updateMock,
          })
        ),
      })
    );
  });

  it("returns 401 when not authenticated", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({ company_name: "Acme", contact_name: "Juan", consent_privacy: true }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("returns 409 when user already has an employer profile", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { email: "employer@example.com", employer_id: "emp-existing" })),
            update: updateMock,
          })
        ),
      })
    );

    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({ company_name: "Acme", contact_name: "Juan", consent_privacy: true }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("rejects consumer email domains (e.g. gmail)", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() =>
          asDoc({
            get: vi.fn(async () => docSnap(true, { email: "user@gmail.com" })),
            update: updateMock,
          })
        ),
      })
    );

    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({
          company_name: "Acme Inc",
          contact_name: "Juan Pérez",
          consent_privacy: true,
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/corporativo|corporate/i);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("creates employer and links it to the authenticated user", async () => {
    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({
          company_name: "Acme Inc",
          contact_name: "Juan Pérez",
          phone: "+56912345678",
          website: "https://acme.example",
          industry: "Technology",
          consent_privacy: true,
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.data.id).toBe("emp-123");
    expect(setMock).toHaveBeenCalled();

    const payload = firstCallArg(setMock);
    expect(payload.company_name).toBe("Acme Inc");
    expect(payload.email).toBe("employer@example.com");
    expect(payload.user_id).toBe("user-1");
    expect(payload.consent_privacy).toBe(true);

    expect(updateMock).toHaveBeenCalledWith({ employer_id: "emp-123" });
  });

  it("ignores email provided in body and uses authenticated user email", async () => {
    await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({
          company_name: "Acme Inc",
          contact_name: "Juan Pérez",
          email: "attacker@example.com",
          consent_privacy: true,
        }),
      })
    );

    const payload = firstCallArg(setMock);
    expect(payload.email).toBe("employer@example.com");
  });

  it("returns 400 for invalid payload", async () => {
    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({ company_name: "", contact_name: "", consent_privacy: true }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("returns 400 when privacy consent is not accepted", async () => {
    const res = await POST(
      new Request("http://localhost/api/employers", {
        method: "POST",
        body: JSON.stringify({ company_name: "Acme", contact_name: "Juan", consent_privacy: false }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });
});
