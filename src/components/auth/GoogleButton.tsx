"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogleIdToken, firebaseConfigured } from "@/lib/firebase.client";
import { apiSend } from "@/lib/client";

// "Continue with Google" button. Runs the Firebase popup client-side, then
// exchanges the resulting ID token for our own server session via
// POST /api/auth/google. On success it routes like the normal login flow.
export function GoogleButton({ remember = false }: { remember?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hide the button entirely when Firebase isn't configured, so users never
  // see a dead control.
  if (!firebaseConfigured()) return null;

  async function onClick() {
    setError(null);
    setBusy(true);
    try {
      const idToken = await signInWithGoogleIdToken();
      const u = await apiSend<{ role: string }>("/api/auth/google", "POST", { idToken, remember });
      router.push(u.role === "ADMIN" ? "/admin" : "/plans");
      router.refresh();
    } catch (err) {
      // Firebase throws when the user closes the popup — treat that quietly.
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      if (!/popup-closed|cancelled|canceled/i.test(msg)) setError(msg);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-6 py-3 font-semibold text-ink-900 transition hover:bg-white/90 disabled:opacity-60"
      >
        <GoogleIcon />
        {busy ? "Connecting…" : "Continue with Google"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
