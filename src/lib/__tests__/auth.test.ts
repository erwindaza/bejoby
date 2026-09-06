import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));
vi.mock("@/lib/gcp/collections", () => ({
  sessions: vi.fn(),
  users: vi.fn(),
  candidates: vi.fn(),
}));

import { getSessionUser } from "../auth";
import { sessions, users, candidates } from "@/lib/gcp/collections";

function asDoc(obj: unknown): DocumentReference {
  return obj as DocumentReference;
}
function asCollection(obj: unknown): CollectionReference {
  return obj as CollectionReference;
}
function docSnap(exists: boolean, data?: Record<string, unknown>) {
  return { exists, data: () => data };
}

const futureExpiry = new Date(Date.now() + 60_000);

describe("getSessionUser — candidate_id auto-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue({ value: "token-1" });
    vi.mocked(sessions).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { user_id: "session-1", expires_at: futureExpiry })) })),
      })
    );
  });

  it("uses the cached candidate_id without querying candidates()", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { email: "a@a.com", candidate_id: "cand-cached" })) })),
      })
    );

    const result = await getSessionUser();
    expect(result?.candidate_id).toBe("cand-cached");
    expect(candidates).not.toHaveBeenCalled();
  });

  it("auto-links candidate_id by matching email when not cached (regression: history/contact used to 404 because session user.id != candidates collection id)", async () => {
    const updateMock = vi.fn(async () => {});
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({
          get: vi.fn(async () => docSnap(true, { email: "a@a.com" })),
          update: updateMock,
        })),
      })
    );
    vi.mocked(candidates).mockReturnValue(
      asCollection({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(async () => ({ empty: false, docs: [{ id: "cand-linked" }] })),
          })),
        })),
      })
    );

    const result = await getSessionUser();
    expect(result?.candidate_id).toBe("cand-linked");
    expect(updateMock).toHaveBeenCalledWith({ candidate_id: "cand-linked" });
  });

  it("does not attempt candidate auto-link for employer sessions", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { email: "e@e.com", employer_id: "emp-1" })) })),
      })
    );

    const result = await getSessionUser();
    expect(result?.candidate_id).toBeUndefined();
    expect(candidates).not.toHaveBeenCalled();
  });

  it("leaves candidate_id undefined when no matching candidate profile exists", async () => {
    vi.mocked(users).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ get: vi.fn(async () => docSnap(true, { email: "nobody@x.com" })) })),
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

    const result = await getSessionUser();
    expect(result?.candidate_id).toBeUndefined();
  });
});
