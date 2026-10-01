import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionReference, DocumentReference } from "@google-cloud/firestore";

vi.mock("@/lib/gcp/collections", () => ({
  consentRecords: vi.fn(),
  auditEvents: vi.fn(),
  dataLineageEvents: vi.fn(),
}));

vi.mock("@google-cloud/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "mock-timestamp"),
  },
}));

import { recordConsent } from "../compliance/consent";
import { consentRecords, auditEvents, dataLineageEvents } from "@/lib/gcp/collections";

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

describe("recordConsent", () => {
  const setMock = vi.fn(async () => {});

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consentRecords).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ id: "consent-123", set: setMock })),
      })
    );
    vi.mocked(auditEvents).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ set: vi.fn(async () => {}) })),
      })
    );
    vi.mocked(dataLineageEvents).mockReturnValue(
      asCollection({
        doc: vi.fn(() => asDoc({ id: "lineage-123", set: vi.fn(async () => {}) })),
      })
    );
  });

  it("creates a consent record with required fields", async () => {
    const id = await recordConsent({
      user_id: "user-1",
      email: "ANA@EXAMPLE.COM",
      consent_type: "coach_usage",
      purpose: "Usar el coach laboral",
      policy_version: "1.0-coach",
      consent_text_snapshot: "Texto exacto mostrado al usuario",
      source: "web",
    });

    expect(id).toBe("consent-123");
    expect(setMock).toHaveBeenCalled();

    const payload = firstCallArg(setMock);
    expect(payload.email).toBe("ana@example.com");
    expect(payload.consent_type).toBe("coach_usage");
    expect(payload.accepted).toBe(true);
    expect(payload.consent_text_snapshot).toBe("Texto exacto mostrado al usuario");
    expect(payload.withdrawn_at).toBeNull();
  });

  it("normalizes optional fields and defaults", async () => {
    await recordConsent({
      user_id: "user-1",
      email: "test@example.com",
      purpose: "Usar el coach",
      policy_version: "1.0",
    });

    const payload = firstCallArg(setMock);
    expect(payload.consent_type).toBe("other");
    expect(payload.legal_basis).toBe("consent");
    expect(payload.source).toBe("web");
    expect(payload.consent_text_snapshot).toBe("");
  });
});
