import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyFirebaseIdToken, FirebaseAuthError } from "@/lib/firebaseVerify";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  idToken: z.string().min(20).max(4096),
  remember: z.boolean().optional(),
});

// POST /api/auth/google
// Body: { idToken: <Firebase ID token from the Google popup>, remember? }
// Verifies the token server-side, upserts the user, and issues our own
// server-side session cookie. Role is NEVER taken from the client.
export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`google:${ip}`, 10).allowed) {
      return fail("Too many sign-in attempts. Try again in a minute.", 429);
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "";
    if (!projectId) return fail("Google sign-in is not configured on the server.", 503);

    const { idToken, remember } = bodySchema.parse(await req.json());

    const claims = await verifyFirebaseIdToken(idToken, projectId);

    // Require a Google-verified email — we key accounts on email.
    const email = claims.email?.toLowerCase().trim();
    if (!email) return fail("Your Google account did not return an email address.", 400);
    if (claims.email_verified === false) return fail("Your Google email is not verified.", 403);

    // Upsert the user by email. For a brand-new user, create with role USER
    // (default). For an existing user, update only the display name if we don't
    // have one yet — never touch role or status from this flow.
    const existing = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existing) {
      if (existing.status === "BLOCKED") {
        return fail("This account has been blocked. Contact support.", 403);
      }
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: existing.name ?? claims.name ?? null,
          // Promote a demo placeholder to a real account on first real login.
          isDemo: false,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: claims.name ?? null,
          isDemo: false,
          // role defaults to "USER", status to "ACTIVE" (schema defaults).
        },
      });
    }

    await createSession(user.id, !!remember);
    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    if (err instanceof FirebaseAuthError) return fail(err.message, 401);
    return handleError(err);
  }
}
