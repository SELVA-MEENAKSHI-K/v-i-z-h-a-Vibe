import { ok, fail, handleError } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    // Login rate limiting (per IP).
    if (!rateLimit(`login:${ip}`, 10).allowed) return fail("Too many login attempts. Try again in a minute.", 429);

    const body = await req.json();
    const input = loginSchema.parse(body);
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    // Generic error — never reveal whether the email exists.
    const genericFail = fail("Invalid email or password.", 401);
    if (!user || !user.passwordHash) return genericFail;
    if (!verifyPassword(input.password, user.passwordHash)) return genericFail;
    if (user.status === "BLOCKED") return fail("This account has been blocked. Contact support.", 403);

    await createSession(user.id, !!input.remember);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return handleError(err);
  }
}
