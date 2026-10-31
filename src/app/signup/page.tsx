"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiSend } from "@/lib/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, MailIcon, LockIcon, UserIcon, PhoneIcon } from "@/components/auth/AuthField";
import { GoogleCardButton } from "@/components/auth/GoogleCardButton";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Please enter a valid email address.";
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      return "Password must be at least 8 characters and include letters and numbers.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!accept) return "Please accept the terms and conditions.";
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
      await apiSend("/api/auth/register", "POST", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        confirmPassword: form.confirmPassword,
        acceptTerms: accept,
      });
      router.push("/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setBusy(false);
    }
  }

  return (
    <AuthShell
      heading="Join"
      headingAccent="VizhaVibe!"
      subtitle="Create your account to plan events, discover venues and vendors, and keep all your celebrations in one place."
    >
      <h2 className="font-display text-3xl font-bold text-ink-900">Create Account</h2>
      <p className="mt-1 text-sm text-ink-900/55">Start planning with VizhaVibe</p>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-kumkum-500/30 bg-kumkum-500/10 px-3 py-2 text-sm text-kumkum-600">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <AuthField label="Full name" icon={<UserIcon />} autoComplete="name" placeholder="Your name" value={form.name} onChange={(e) => set("name", e.target.value)} />
        <AuthField label="Email" icon={<MailIcon />} type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
        <AuthField label="Phone number" icon={<PhoneIcon />} type="tel" autoComplete="tel" placeholder="Optional" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <AuthField
          label="Password"
          icon={<LockIcon />}
          password
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="At least 8 characters, with letters and numbers."
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <AuthField
          label="Confirm password"
          icon={<LockIcon />}
          password
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />

        <label className="flex items-start gap-2 text-sm text-ink-900/70">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-plum-600" />
          I accept the terms and conditions.
        </label>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-plum-600 via-kumkum-500 to-saffron-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-plum-600/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create Account"}
          {!busy && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>

        <GoogleCardButton />
      </form>

      <p className="mt-6 text-center text-sm text-ink-900/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-kumkum-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
