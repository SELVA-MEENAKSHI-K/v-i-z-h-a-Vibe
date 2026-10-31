import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, passwordIssues } from "@/lib/auth";

describe("password hashing (scrypt)", () => {
  it("hashes to a salt:hash string and verifies the correct password", () => {
    const stored = hashPassword("Passw0rd1");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(verifyPassword("Passw0rd1", stored)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const stored = hashPassword("Passw0rd1");
    expect(verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("produces a unique salt per hash (no deterministic output)", () => {
    const a = hashPassword("samePassword1");
    const b = hashPassword("samePassword1");
    expect(a).not.toBe(b);
    expect(verifyPassword("samePassword1", a)).toBe(true);
    expect(verifyPassword("samePassword1", b)).toBe(true);
  });

  it("safely rejects malformed or empty stored hashes", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", undefined)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "no-colon-here")).toBe(false);
    expect(verifyPassword("x", "deadbeef:short")).toBe(false);
  });
});

describe("password policy", () => {
  it("accepts a strong password (>=8 chars, letters + digits)", () => {
    expect(passwordIssues("Passw0rd1")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(passwordIssues("Ab1")).toMatch(/at least 8/i);
  });

  it("rejects passwords missing a digit", () => {
    expect(passwordIssues("OnlyLetters")).toMatch(/letters and numbers/i);
  });

  it("rejects passwords missing a letter", () => {
    expect(passwordIssues("12345678")).toMatch(/letters and numbers/i);
  });
});
