"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { apiSend } from "@/lib/client";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/auth/register", "POST", { ...form, phone: form.phone || null, acceptTerms: accept });
      router.push("/plans");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex max-w-md flex-col px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Create your account</h1>
        <p className="mt-1 text-white/60">Save your venues, themes, menus, budgets and AI plans.</p>

        {error && <div role="alert" className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 vv-glass p-6">
          <Field label="Full name" required>
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="vv-authinput" autoComplete="name" />
          </Field>
          <Field label="Email" required>
            <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className="vv-authinput" autoComplete="email" />
          </Field>
          <Field label="Mobile number" optional>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="vv-authinput" autoComplete="tel" />
          </Field>
          <Field label="Password" required>
            <input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} className="vv-authinput" autoComplete="new-password" />
            <span className="mt-1 block text-[11px] text-white/45">At least 8 characters, with letters and numbers.</span>
          </Field>
          <Field label="Confirm password" required>
            <input type="password" required value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="vv-authinput" autoComplete="new-password" />
          </Field>
          <label className="flex items-start gap-2 text-sm text-white/70">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-saffron-500" required />
            I accept the terms and conditions.
          </label>
          <button type="submit" disabled={busy} className="w-full rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
            {busy ? "Creating…" : "Create account"}
          </button>

          <GoogleButton />
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-saffron-400 hover:underline">
            Log in
          </Link>
        </p>

        <style jsx global>{`
          .vv-authinput {
            width: 100%;
            border-radius: 0.6rem;
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: rgba(255, 255, 255, 0.05);
            padding: 0.55rem 0.75rem;
            font-size: 0.9rem;
            color: #f4f1ea;
          }
        `}</style>
      </main>
    </>
  );
}

function Field({ label, children, required, optional }: { label: string; children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">
        {label}
        {required && <span className="ml-0.5 text-kumkum-500">*</span>}
        {optional && <span className="ml-1 text-xs font-normal text-white/40">(optional)</span>}
      </span>
      {children}
    </label>
  );
}
