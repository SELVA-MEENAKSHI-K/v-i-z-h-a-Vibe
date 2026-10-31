import { ok, fail, handleError } from "@/lib/api";
import { updateProfileSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { requireUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const u = await requireUser();
    const full = await prisma.user.findUnique({ where: { id: u.id } });
    return ok({
      id: u.id,
      name: full?.name ?? null,
      email: full?.email ?? null,
      phone: full?.phone ?? null,
      role: full?.role ?? "USER",
      createdAt: full?.createdAt ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const u = await requireUser();
    const input = updateProfileSchema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id: u.id }, // users can only edit THEIR OWN profile
      data: { name: input.name ?? undefined, phone: input.phone === undefined ? undefined : input.phone },
    });
    return ok({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone });
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    return handleError(err);
  }
}
