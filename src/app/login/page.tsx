"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { apiSend } from "@/lib/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = await apiSend<{ role: string }>("/api/auth/login", "POST", { email, password, remember });
      router.push(u.role === "ADMIN" ? "/admin" : "/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-white/60">Log in to access your saved event plans.</p>

        {error && <div role="alert" className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 vv-glass p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-white/80">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="email" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-white/80">Password</span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="current-password" />
          </label>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-white/70">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-saffron-500" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-peacock-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
            {busy ? "Logging in…" : "Log in"}
          </button>

          <GoogleButton remember={remember} />
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          No account?{" "}
          <Link href="/signup" className="text-saffron-400 hover:underline">
            Create one
          </Link>
        </p>
      </main>
    </>
  );
}
