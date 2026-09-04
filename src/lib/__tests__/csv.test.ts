import { describe, it, expect } from "vitest";
import { toCsv, toCsvValue } from "@/lib/csv";

describe("toCsvValue", () => {
  it("quotes values containing commas, quotes, or newlines", () => {
    expect(toCsvValue("plain")).toBe("plain");
    expect(toCsvValue("a,b")).toBe('"a,b"');
    expect(toCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(toCsvValue("line1\nline2")).toBe('"line1\nline2"');
  });

  it("treats null/undefined as empty string", () => {
    expect(toCsvValue(null)).toBe("");
    expect(toCsvValue(undefined)).toBe("");
  });
});

describe("toCsv", () => {
  it("returns empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("builds header + rows from object keys", () => {
    const csv = toCsv([
      { id: "1", name: "Alice, Inc." },
      { id: "2", name: "Bob" },
    ]);
    expect(csv).toBe('id,name\n1,"Alice, Inc."\n2,Bob');
  });
});
