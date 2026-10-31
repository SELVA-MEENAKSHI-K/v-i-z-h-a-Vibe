// Server-side verification of Firebase ID tokens WITHOUT the firebase-admin
// package. A Firebase ID token is a standard RS256 JWT signed by Google. We:
//   1. Parse the JWT header to find the signing key id (kid).
//   2. Fetch Google's public X.509 certs (cached per their Cache-Control).
//   3. Verify the RS256 signature against the matching cert.
//   4. Validate the standard claims: aud (your project id), iss, exp, iat,
//      and that the token is not used before its issue time.
//
// This is the same validation firebase-admin performs, implemented with Node's
// built-in crypto so we avoid a heavy dependency (consistent with the project's
// scrypt-over-bcrypt choice).

import { createPublicKey, createVerify } from "node:crypto";

const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

type Certs = Record<string, string>;
let certCache: { certs: Certs; expiresAt: number } | null = null;

function b64urlToBuffer(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function b64urlToJson<T>(input: string): T {
  return JSON.parse(b64urlToBuffer(input).toString("utf8")) as T;
}

async function getGoogleCerts(): Promise<Certs> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) return certCache.certs;

  const res = await fetch(CERT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not fetch Google signing certificates.");
  const certs = (await res.json()) as Certs;

  // Respect Cache-Control max-age (fall back to 1 hour).
  const cc = res.headers.get("cache-control") || "";
  const m = cc.match(/max-age=(\d+)/);
  const maxAgeMs = (m ? Number(m[1]) : 3600) * 1000;
  certCache = { certs, expiresAt: now + maxAgeMs };
  return certs;
}

export type FirebaseTokenClaims = {
  sub: string; // Firebase UID
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
  auth_time?: number;
  firebase?: { sign_in_provider?: string };
};

export class FirebaseAuthError extends Error {}

// Verifies a Firebase ID token and returns its claims, or throws
// FirebaseAuthError. `projectId` must be your Firebase project id.
export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<FirebaseTokenClaims> {
  if (!projectId) throw new FirebaseAuthError("Server is not configured for Google sign-in.");
  if (!idToken || idToken.split(".").length !== 3) throw new FirebaseAuthError("Malformed token.");

  const [headerB64, payloadB64, signatureB64] = idToken.split(".");
  const header = b64urlToJson<{ alg: string; kid: string }>(headerB64);

  if (header.alg !== "RS256") throw new FirebaseAuthError("Unexpected token algorithm.");
  if (!header.kid) throw new FirebaseAuthError("Token is missing a key id.");

  const certs = await getGoogleCerts();
  const cert = certs[header.kid];
  if (!cert) throw new FirebaseAuthError("Token signed by an unknown key.");

  // Verify signature.
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  const publicKey = createPublicKey(cert);
  const signatureOk = verifier.verify(publicKey, b64urlToBuffer(signatureB64));
  if (!signatureOk) throw new FirebaseAuthError("Invalid token signature.");

  // Validate claims.
  const claims = b64urlToJson<FirebaseTokenClaims>(payloadB64);
  const nowSec = Math.floor(Date.now() / 1000);
  const skew = 60; // allow 60s clock skew

  if (claims.aud !== projectId) throw new FirebaseAuthError("Token audience mismatch.");
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) throw new FirebaseAuthError("Token issuer mismatch.");
  if (typeof claims.exp !== "number" || claims.exp < nowSec - skew) throw new FirebaseAuthError("Token has expired.");
  if (typeof claims.iat !== "number" || claims.iat > nowSec + skew) throw new FirebaseAuthError("Token issued in the future.");
  if (!claims.sub) throw new FirebaseAuthError("Token is missing a subject.");

  return claims;
}
