"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { apiGet, apiSend } from "@/lib/client";
import { useAuth } from "@/lib/useAuth";

type Stats = { totalUsers: number; activeUsers: number; blockedUsers: number; totalEvents: number; totalPlansGenerated: number; newUsersThisMonth: number };
type Row = { id: string; name: string | null; email: string | null; phone: string | null; role: string; status: string; createdAt: string; eventCount: number };
type UsersResp = { total: number; page: number; pages: number; users: Row[] };

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<UsersResp | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string; to: "ACTIVE" | "BLOCKED" } | null>(null);

  const loadUsers = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search.trim()) qs.set("search", search.trim());
    if (role) qs.set("role", role);
    if (status) qs.set("status", status);
    try {
      setData(await apiGet<UsersResp>(`/api/admin/users?${qs}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    }
  }, [page, search, role, status]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "ADMIN") return;
    apiGet<Stats>("/api/admin/dashboard/stats").then(setStats).catch(() => {});
    loadUsers();
  }, [authLoading, user, loadUsers]);

  async function applyStatus() {
    if (!confirm) return;
    try {
      await apiSend(`/api/admin/users/${confirm.id}/status`, "PATCH", { status: confirm.to });
      setConfirm(null);
      loadUsers();
      apiGet<Stats>("/api/admin/dashboard/stats").then(setStats).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      setConfirm(null);
    }
  }

  // Unauthorized state (client guard; the API also enforces admin server-side).
  if (!authLoading && (!user || user.role !== "ADMIN")) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="text-5xl" aria-hidden>🔒</div>
          <h1 className="mt-4 font-display text-3xl font-semibold">Unauthorized access</h1>
          <p className="mt-2 text-white/60">This area is for administrators only.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg bg-saffron-500 px-6 py-2 font-semibold text-ink-900">Back home</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>

        {error && <div className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        {/* Stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total users" value={stats?.totalUsers} />
          <Stat label="Active" value={stats?.activeUsers} tone="emerald" />
          <Stat label="Blocked" value={stats?.blockedUsers} tone="red" />
          <Stat label="Events" value={stats?.totalEvents} />
          <Stat label="AI plans" value={stats?.totalPlansGenerated} />
          <Stat label="New this month" value={stats?.newUsersThisMonth} tone="saffron" />
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm">
            <option value="" className="bg-ink-800">All roles</option>
            <option value="USER" className="bg-ink-800">User</option>
            <option value="ADMIN" className="bg-ink-800">Admin</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="vv-select rounded-lg border border-white/15 px-3 py-2 text-sm">
            <option value="" className="bg-ink-800">All status</option>
            <option value="ACTIVE" className="bg-ink-800">Active</option>
            <option value="BLOCKED" className="bg-ink-800">Blocked</option>
          </select>
        </div>

        {/* Users table */}
        <div className="vv-scroll mt-4 overflow-x-auto rounded-2xl border border-white/10 vv-glass">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-white/50">
              <tr className="border-b border-white/10 text-left">
                <th className="p-3">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Events</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3 font-medium">{u.name ?? "—"}</td>
                  <td className="text-white/70">{u.email}</td>
                  <td><span className={`rounded-full px-2 py-0.5 text-[11px] ${u.role === "ADMIN" ? "bg-plum-600/40 text-violet-200" : "bg-white/5 text-white/60"}`}>{u.role}</span></td>
                  <td><span className={`rounded-full px-2 py-0.5 text-[11px] ${u.status === "BLOCKED" ? "bg-kumkum-500/30 text-red-200" : "bg-emerald-400/15 text-emerald-300"}`}>{u.status}</span></td>
                  <td className="text-white/70">{u.eventCount}</td>
                  <td className="text-white/50">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-2 text-right">
                    <Link href={`/admin/users/${u.id}`} className="mr-2 text-peacock-400 hover:underline">View</Link>
                    {u.id !== user?.id && (
                      <button
                        onClick={() => setConfirm({ id: u.id, name: u.name ?? u.email ?? "user", to: u.status === "BLOCKED" ? "ACTIVE" : "BLOCKED" })}
                        className={`rounded px-2 py-1 text-xs ${u.status === "BLOCKED" ? "bg-emerald-600/80 text-white" : "bg-kumkum-500/80 text-white"}`}
                      >
                        {u.status === "BLOCKED" ? "Unblock" : "Block"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.users.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-white/50">No users match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40">← Prev</button>
            <span className="text-white/60">Page {data.page} of {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40">Next →</button>
          </div>
        )}
      </main>

      {/* Confirm dialog */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirm(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="confirm-title" className="font-semibold">{confirm.to === "BLOCKED" ? "Block" : "Unblock"} account?</h3>
            <p className="mt-2 text-sm text-white/65">
              {confirm.to === "BLOCKED" ? "This will block" : "This will restore access for"} <span className="font-medium text-white">{confirm.name}</span>
              {confirm.to === "BLOCKED" ? " and end their active sessions." : "."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-lg px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
              <button onClick={applyStatus} className={`rounded-lg px-4 py-2 text-sm font-semibold ${confirm.to === "BLOCKED" ? "bg-kumkum-500 text-white" : "bg-emerald-600 text-white"}`}>
                {confirm.to === "BLOCKED" ? "Block" : "Unblock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value?: number; tone?: "emerald" | "red" | "saffron" }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "red" ? "text-red-300" : tone === "saffron" ? "text-saffron-400" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 vv-glass p-4">
      <div className={`font-display text-2xl font-semibold ${color}`}>{value ?? "—"}</div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
    </div>
  );
}
