// Authentication core — password hashing (Node scrypt, no external deps),
// server-side sessions, signed HTTP-only session cookies, and role checks.
//
// Why scrypt: it's a memory-hard KDF built into Node's crypto module, so we get
// strong password hashing without adding bcrypt/argon2 packages.

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const SESSION_COOKIE = "vv_session";
const SESSION_DAYS = 7;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) return secret;
  // In production we must never sign sessions with a predictable fallback.
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is not configured (or too short). Refusing to sign sessions insecurely.");
  }
  return "dev-insecure-secret-change-me";
}

// ---- Password hashing (scrypt) ---------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const derived = scryptSync(password, salt, 64);
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}

// Strong-password policy: >=8 chars, letters + digits.
export function passwordIssues(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must include letters and numbers.";
  return null;
}

// ---- Tokens ----------------------------------------------------------------

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export function sha256Hex(value: string): string {
  // For reset tokens we store only a keyed hash, never the raw token.
  return createHmac("sha256", authSecret()).update(value).digest("hex");
}

// ---- Session cookie (id.signature) -----------------------------------------

function sign(sessionId: string): string {
  return createHmac("sha256", authSecret()).update(sessionId).digest("hex");
}

export async function createSession(userId: string, remember: boolean): Promise<void> {
  const days = remember ? 30 : SESSION_DAYS;
  const expiresAt = new Date(Date.now() + days * 86400000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  const value = `${session.id}.${sign(session.id)}`;
  cookies().set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (raw) {
    const [id] = raw.split(".");
    if (id) await prisma.session.deleteMany({ where: { id } }).catch(() => {});
  }
  cookies().set(SESSION_COOKIE, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
};

// Returns the authenticated, non-blocked user for the current request, or null.
export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw || !raw.includes(".")) return null;
  const [id, sig] = raw.split(".");
  // Verify signature before any DB lookup (cheap tamper check).
  const expected = sign(id);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  const session = await prisma.session.findUnique({ where: { id }, include: { user: true } }).catch(() => null);
  if (!session || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (!u || u.status === "BLOCKED") return null;
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role, status: u.status, createdAt: u.createdAt };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new AuthError("Authentication required.", 401);
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new AuthError("Admin access required.", 403);
  return u;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// IDOR guard for a plan. Rules:
//  - If the plan is owned by the demo user (shareable demo), allow (public demo).
//  - Else the current session user must be the owner (or an ADMIN).
// Throws AuthError(403/401) on violation.
export async function assertCanAccessPlan(planOwnerId: string | null): Promise<void> {
  // Demo-user plans: resolve the demo user id lazily.
  const demo = await prisma.user.findUnique({ where: { email: "demo@vizhavibe.local" }, select: { id: true } });
  if (planOwnerId && demo && planOwnerId === demo.id) return; // public demo plan
  const u = await getSessionUser();
  if (!u) throw new AuthError("Authentication required.", 401);
  if (u.role === "ADMIN") return;
  if (planOwnerId && planOwnerId === u.id) return;
  throw new AuthError("You don't have access to this plan.", 403);
}
