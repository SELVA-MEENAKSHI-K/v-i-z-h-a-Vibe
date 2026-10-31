"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { apiSend } from "@/lib/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiSend("/api/auth/forgot-password", "POST", { email });
    } catch {
      /* intentionally ignore — never reveal whether the email exists */
    } finally {
      setDone(true);
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl font-semibold">Reset your password</h1>
        {done ? (
          <div className="mt-6 rounded-2xl border border-white/10 vv-glass p-6 text-sm text-white/75">
            If that email is registered, a reset link has been sent. Check your inbox (and, in local dev, the server logs).
            <div className="mt-4">
              <Link href="/login" className="text-saffron-400 hover:underline">Back to login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 vv-glass p-6">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white/80">Registered email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="email" />
            </label>
            <button disabled={busy} className="w-full rounded-xl bg-saffron-500 px-6 py-3 font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-60">
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
