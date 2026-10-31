import { ok, fail, handleError } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { hashPassword, passwordIssues, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`register:${ip}`, 10).allowed) return fail("Too many attempts. Try again later.", 429);

    const body = await req.json();
    const input = registerSchema.parse(body);

    if (input.password !== input.confirmPassword) return fail("Passwords do not match.", 422);
    const pwIssue = passwordIssues(input.password);
    if (pwIssue) return fail(pwIssue, 422);

    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    // If the email exists AND already has a password, block duplicate signup.
    if (existing?.passwordHash) return fail("An account with this email already exists.", 409);

    const passwordHash = hashPassword(input.password);
    // Public registration ALWAYS creates a USER — role is never taken from input.
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name: input.name, phone: input.phone ?? null, passwordHash, role: "USER", status: "ACTIVE", isDemo: false },
        })
      : await prisma.user.create({
          data: { name: input.name, email, phone: input.phone ?? null, passwordHash, role: "USER", status: "ACTIVE" },
        });

    await createSession(user.id, false);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
