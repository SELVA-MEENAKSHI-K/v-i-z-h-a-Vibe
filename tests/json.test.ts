import { describe, it, expect } from "vitest";
import { parseJson, parseJsonArray } from "@/lib/json";

describe("parseJson", () => {
  it("parses valid JSON", () => {
    expect(parseJson('{"a":1}', {})).toEqual({ a: 1 });
    expect(parseJson<number[]>("[1,2,3]", [])).toEqual([1, 2, 3]);
  });
  it("returns the fallback for null/empty/invalid input", () => {
    expect(parseJson(null, "fb")).toBe("fb");
    expect(parseJson(undefined, 0)).toBe(0);
    expect(parseJson("", [])).toEqual([]);
    expect(parseJson("{not json", { ok: true })).toEqual({ ok: true });
  });
});

describe("parseJsonArray", () => {
  it("returns a string array for valid array JSON", () => {
    expect(parseJsonArray('["a","b"]')).toEqual(["a", "b"]);
  });
  it("returns [] for null/empty/invalid/non-array input", () => {
    expect(parseJsonArray(null)).toEqual([]);
    expect(parseJsonArray("")).toEqual([]);
    expect(parseJsonArray("nope")).toEqual([]);
    expect(parseJsonArray('{"a":1}')).toEqual([]);
  });
});
