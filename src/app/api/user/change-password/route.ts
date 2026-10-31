import { ok, fail, handleError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { requireUser, verifyPassword, hashPassword, passwordIssues, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const u = await requireUser();
    const input = changePasswordSchema.parse(await req.json());

    const full = await prisma.user.findUnique({ where: { id: u.id } });
    if (!full?.passwordHash || !verifyPassword(input.currentPassword, full.passwordHash)) {
      return fail("Current password is incorrect.", 403);
    }
    const issue = passwordIssues(input.newPassword);
    if (issue) return fail(issue, 422);

    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: hashPassword(input.newPassword) } });
    return ok({ message: "Password changed." });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
