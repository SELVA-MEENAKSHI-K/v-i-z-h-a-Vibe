import { ok, fail, handleError } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { hashPassword, passwordIssues, sha256Hex } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`reset:${ip}`, 10).allowed) return fail("Too many requests. Try again later.", 429);

    const body = await req.json();
    const input = resetPasswordSchema.parse(body);

    const pwIssue = passwordIssues(input.password);
    if (pwIssue) return fail(pwIssue, 422);

    const tokenHash = sha256Hex(input.token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return fail("This reset link is invalid or has expired.", 400);
    }

    const passwordHash = hashPassword(input.password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Revoke all existing sessions for safety after a reset.
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);

    return ok({ message: "Password updated. You can now log in." });
  } catch (err) {
    return handleError(err);
  }
}
