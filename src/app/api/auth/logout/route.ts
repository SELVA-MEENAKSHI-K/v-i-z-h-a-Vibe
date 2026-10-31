import { ok, handleError } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
    return ok({ loggedOut: true });
  } catch (err) {
    return handleError(err);
  }
}
