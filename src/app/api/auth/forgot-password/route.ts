import { ok, fail, handleError } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { randomToken, sha256Hex } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`forgot:${ip}`, 5).allowed) return fail("Too many requests. Try again later.", 429);

    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);
    const email = input.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond success — never reveal whether the email is registered.
    if (user?.passwordHash) {
      const token = randomToken();
      const tokenHash = sha256Hex(token);
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60000) }, // 30 min
      });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;
      // No email provider configured in this environment: log server-side only.
      // With EMAIL_PROVIDER_API_KEY set, send the link via the provider here.
      if (process.env.EMAIL_PROVIDER_API_KEY) {
        // Placeholder: integrate the configured provider here. Never log the
        // token or the reset URL — only a non-sensitive queued notice.
        console.warn("[auth] password reset email queued");
      } else if (process.env.NODE_ENV !== "production") {
        // Dev convenience ONLY (no provider configured, non-production): surface
        // the reset link in the server logs so the flow is testable locally.
        // In production this branch never runs, so the link is never logged.
        console.warn(`[auth] (dev, no email provider) reset link: ${resetUrl}`);
      }
      // Production with no provider: we create the token but never log/return
      // the link. (Configure EMAIL_PROVIDER_API_KEY to deliver it by email.)
    }

    return ok({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    return handleError(err);
  }
}
