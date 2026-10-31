"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/ui/Header";
import { apiGet, apiSend } from "@/lib/client";

type Profile = { id: string; name: string | null; email: string | null; phone: string | null; role: string; createdAt: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    apiGet<Profile>("/api/user/profile")
      .then((d) => {
        setP(d);
        setName(d.name ?? "");
        setPhone(d.phone ?? "");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiSend("/api/user/profile", "PATCH", { name, phone: phone || null });
      setMsg("Profile updated.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      await apiSend("/api/user/change-password", "PATCH", pw);
      setMsg("Password changed.");
      setPw({ currentPassword: "", newPassword: "" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not change password.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) return (<><Header /><main className="mx-auto max-w-lg px-4 py-12 text-white/60">Loading…</main></>);

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-lg px-4 py-10">
        <h1 className="font-display text-3xl font-semibold">My profile</h1>

        {msg && <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">{msg}</div>}
        {err && <div className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}

        <div className="mt-6 space-y-2 rounded-2xl border border-white/10 vv-glass p-5 text-sm">
          <Row label="Email" value={p?.email ?? "—"} />
          <Row label="Role" value={p?.role ?? "USER"} />
          <Row label="Member since" value={p?.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
        </div>

        <form onSubmit={saveProfile} className="mt-4 space-y-3 rounded-2xl border border-white/10 vv-glass p-5">
          <h2 className="font-semibold">Edit details</h2>
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">Mobile number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2" />
          </label>
          <button className="rounded-lg bg-saffron-500 px-5 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400">Save changes</button>
        </form>

        <form onSubmit={changePw} className="mt-4 space-y-3 rounded-2xl border border-white/10 vv-glass p-5">
          <h2 className="font-semibold">Change password</h2>
          <input type="password" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="current-password" />
          <input type="password" placeholder="New password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm" autoComplete="new-password" />
          <button className="rounded-lg border border-white/15 px-5 py-2 text-sm text-white/85 hover:bg-white/5">Update password</button>
        </form>

        <button onClick={logout} className="mt-4 w-full rounded-xl border border-kumkum-500/40 bg-kumkum-500/10 px-5 py-2.5 text-sm font-medium text-red-200 hover:bg-kumkum-500/20">
          Log out
        </button>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
