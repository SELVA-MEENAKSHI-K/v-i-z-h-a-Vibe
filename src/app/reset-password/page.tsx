"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { apiSend } from "@/lib/client";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiSend("/api/auth/reset-password", "POST", { token, password });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
      setBusy(false);
    }
  }

  if (!token) {
    return <p className="mt-6 text-sm text-white/60">Missing or invalid reset link. <Link href="/forgot-password" className="text-saffron-400 hover:underline">Request a new one</Link>.</p>;
  }
  if (done) {
    return <p className="mt-6 text-sm text-emerald-300">Password updated. Redirecting to login…</p>;
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 vv-glass p-6">
      {error && <div className="rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-white/80">New password</span>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="new-password" />
        <span className="mt-1 block text-[11px] text-white/45">At least 8 characters, with letters and numbers.</span>
      </label>
      <button disabled={busy} className="w-full rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Choose a new password</h1>
        <Suspense fallback={<p className="mt-6 text-white/60">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </main>
    </>
  );
}
