"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, MailIcon, LockIcon } from "@/components/auth/AuthField";
import { GoogleCardButton } from "@/components/auth/GoogleCardButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    if (!password) return "Please enter your password.";
    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const u = await apiSend<{ role: string }>("/api/auth/login", "POST", { email: email.trim(), password, remember });
      router.push(u.role === "ADMIN" ? "/admin" : "/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      heading="Welcome"
      headingAccent="Back!"
      subtitle="Log in to access your saved event plans, manage your activities and stay connected with the VizhaVibe community."
    >
      {/* right-card: desktop logo tagline is in the shell; here is the form head */}
      <h2 className="font-display text-3xl font-bold text-ink-900">Log In</h2>
      <p className="mt-1 text-sm text-ink-900/55">Access your VizhaVibe account</p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-kumkum-500/30 bg-kumkum-500/10 px-3 py-2 text-sm text-kumkum-600">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <AuthField
          label="Email"
          icon={<MailIcon />}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          icon={<LockIcon />}
          password
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-900/70">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-plum-600" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-kumkum-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-plum-600 via-kumkum-500 to-saffron-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-plum-600/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Logging in…" : "Log in"}
          {!busy && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-3 text-xs text-ink-900/40">
          <span className="h-px flex-1 bg-ink-900/10" />
          or
          <span className="h-px flex-1 bg-ink-900/10" />
        </div>

        <GoogleCardButton remember={remember} />
      </form>

      <p className="mt-6 text-center text-sm text-ink-900/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-kumkum-600 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
