import { ok, handleError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns the current user (safe fields only) or { user: null }.
export async function GET() {
  try {
    const u = await getSessionUser();
    if (!u) return ok({ user: null });
    return ok({
      user: { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, createdAt: u.createdAt },
    });
  } catch (err) {
    return handleError(err);
  }
}
