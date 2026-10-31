import { describe, it, expect } from "vitest";
import { verifyFirebaseIdToken, FirebaseAuthError } from "@/lib/firebaseVerify";

// These tests exercise the token-validation guards that run BEFORE any network
// fetch of Google's certs, so they need no external calls. They prove the
// verifier rejects malformed / tampered tokens and missing configuration.

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

const PROJECT = "vizhavibe-test";

describe("verifyFirebaseIdToken — guards", () => {
  it("rejects when no projectId is configured", async () => {
    await expect(verifyFirebaseIdToken("a.b.c", "")).rejects.toBeInstanceOf(FirebaseAuthError);
  });

  it("rejects a token that is not three segments", async () => {
    await expect(verifyFirebaseIdToken("not-a-jwt", PROJECT)).rejects.toThrow(/malformed/i);
    await expect(verifyFirebaseIdToken("only.two", PROJECT)).rejects.toThrow(/malformed/i);
  });

  it("rejects a non-RS256 algorithm", async () => {
    const token = `${b64url({ alg: "HS256", kid: "x" })}.${b64url({ sub: "u" })}.sig`;
    await expect(verifyFirebaseIdToken(token, PROJECT)).rejects.toThrow(/algorithm/i);
  });

  it("rejects a token missing a key id", async () => {
    const token = `${b64url({ alg: "RS256" })}.${b64url({ sub: "u" })}.sig`;
    await expect(verifyFirebaseIdToken(token, PROJECT)).rejects.toThrow(/key id/i);
  });
});
