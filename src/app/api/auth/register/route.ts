import { ok, fail, handleError } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { hashPassword, passwordIssues, createSession, authSecretReady } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`register:${ip}`, 10).allowed) return fail("Too many attempts. Try again later.", 429);

    // Fail fast with a CLEAR message BEFORE any DB write if the server can't
    // sign a session. Otherwise createSession() would throw AFTER the user row
    // is created, surfacing a blind 500 and leaving a half-finished account.
    // (This is the most common cause of registration 500s in a fresh deploy:
    // AUTH_SECRET not set / too short in the server environment.)
    if (!authSecretReady()) {
      console.error("[auth/register] AUTH_SECRET is missing or too short — cannot sign sessions. Set AUTH_SECRET (>=32 chars) in the server environment.");
      return fail("Sign-up is temporarily unavailable due to a server configuration issue. Please try again later.", 503);
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    if (input.password !== input.confirmPassword) return fail("Passwords do not match.", 422);
    const pwIssue = passwordIssues(input.password);
    if (pwIssue) return fail(pwIssue, 422);

    const email = input.email.toLowerCase();

    // Idempotent & retry-safe: a passwordless row (e.g. an earlier Google-only
    // or demo stub) is upgraded; a row that already has a password is rejected
    // as a duplicate. The unique email + this check prevent duplicate accounts
    // on double-submits/retries. We also catch the DB unique-constraint race.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) return fail("An account with this email already exists.", 409);

    const passwordHash = hashPassword(input.password);
    // Public registration ALWAYS creates a USER — role is never taken from input.
    let user;
    try {
      user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { name: input.name, phone: input.phone ?? null, passwordHash, role: "USER", status: "ACTIVE", isDemo: false },
          })
        : await prisma.user.create({
            data: { name: input.name, email, phone: input.phone ?? null, passwordHash, role: "USER", status: "ACTIVE" },
          });
    } catch (dbErr) {
      // P2002 = unique constraint: two concurrent signups for the same email.
      // Treat as a duplicate (not a 500) so retries are safe and honest.
      if (dbErr && typeof dbErr === "object" && "code" in dbErr && (dbErr as { code?: string }).code === "P2002") {
        return fail("An account with this email already exists.", 409);
      }
      throw dbErr;
    }

    await createSession(user.id, false);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    // handleError logs full detail server-side (never secrets) and returns a
    // safe, generic message; it maps Prisma connectivity errors to a clear 503.
    return handleError(err);
  }
}
