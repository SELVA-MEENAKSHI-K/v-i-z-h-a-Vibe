"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { apiGet, apiSend, formatINR } from "@/lib/client";
import { useAuth } from "@/lib/useAuth";

// ---------------------------------------------------------------------------
// Admin Dashboard — a single, tabbed monitoring surface over the whole
// VizhaVibe database. Every tab reads REAL records (admin-only, server-enforced
// via requireAdmin()). No dummy data. Users tab keeps block/unblock controls;
// the rest are read-only monitoring views with search + pagination.
// ---------------------------------------------------------------------------

type Stats = {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalEvents: number;
  totalPlansGenerated: number;
  newUsersThisMonth: number;
  totalVenues: number;
  totalBudgetItems: number;
  totalVendors: number;
  totalMenus: number;
  totalTasks: number;
};

type Owner = { id: string; name: string | null; email: string | null } | null;
type EventRef = { id: string; title: string; city?: string } | null;

type UserRow = { id: string; name: string | null; email: string | null; phone: string | null; role: string; status: string; createdAt: string; eventCount: number };
type UsersResp = { total: number; page: number; pages: number; users: UserRow[] };

type DataResp = { total: number; page: number; pageSize: number; pages: number; rows: Record<string, unknown>[] };

type TabKey = "users" | "events" | "aiplans" | "venues" | "budgets" | "vendors" | "themes" | "timelines";

const TABS: { key: TabKey; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "events", label: "Events" },
  { key: "aiplans", label: "AI Plans" },
  { key: "venues", label: "Venues" },
  { key: "budgets", label: "Budgets" },
  { key: "vendors", label: "Vendors" },
  { key: "themes", label: "Themes & Food" },
  { key: "timelines", label: "Timelines" },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<TabKey>("users");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user && user.role === "ADMIN";

  const refreshStats = useCallback(() => {
    apiGet<Stats>("/api/admin/dashboard/stats").then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    refreshStats();
  }, [authLoading, isAdmin, refreshStats]);

  // Unauthorized state (client guard; the API also enforces admin server-side).
  if (!authLoading && !isAdmin) {
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Admin dashboard</h1>
            <p className="mt-1 text-sm text-white/55">Live view of every user&apos;s event-planning data.</p>
          </div>
          <span className="rounded-full bg-plum-600/40 px-3 py-1 text-xs text-violet-200">Signed in as {user?.email}</span>
        </div>

        {error && <div className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}

        {/* Summary cards */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total users" value={stats?.totalUsers} />
          <Stat label="Active" value={stats?.activeUsers} tone="emerald" />
          <Stat label="Blocked" value={stats?.blockedUsers} tone="red" />
          <Stat label="Events" value={stats?.totalEvents} />
          <Stat label="AI plans" value={stats?.totalPlansGenerated} />
          <Stat label="New this month" value={stats?.newUsersThisMonth} tone="saffron" />
          <Stat label="Saved venues" value={stats?.totalVenues} />
          <Stat label="Budget items" value={stats?.totalBudgetItems} />
          <Stat label="Vendor enquiries" value={stats?.totalVendors} />
          <Stat label="Menus" value={stats?.totalMenus} />
          <Stat label="Timeline tasks" value={stats?.totalTasks} />
        </div>

        {/* Tabs */}
        <div className="vv-scroll mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(null); }}
              className={`whitespace-nowrap rounded-t-lg px-4 py-2 text-sm transition ${
                tab === t.key ? "bg-white/10 font-semibold text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "users" ? (
            <UsersTab adminId={user?.id} onError={setError} onMutated={refreshStats} />
          ) : (
            <DataTab key={tab} entity={tab} onError={setError} />
          )}
        </div>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Users tab — full management (search, filter, block/unblock).
// ---------------------------------------------------------------------------

function UsersTab({ adminId, onError, onMutated }: { adminId?: string; onError: (m: string | null) => void; onMutated: () => void }) {
  const [data, setData] = useState<UsersResp | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState<{ id: string; name: string; to: "ACTIVE" | "BLOCKED" } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search.trim()) qs.set("search", search.trim());
    if (role) qs.set("role", role);
    if (status) qs.set("status", status);
    try {
      setData(await apiGet<UsersResp>(`/api/admin/users?${qs}`));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load users.");
    }
  }, [page, search, role, status, onError]);

  useEffect(() => { load(); }, [load]);

  async function applyStatus() {
    if (!confirm) return;
    try {
      await apiSend(`/api/admin/users/${confirm.id}/status`, "PATCH", { status: confirm.to });
      setConfirm(null);
      load();
      onMutated();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Action failed.");
      setConfirm(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
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

      <div className="vv-scroll mt-4 overflow-x-auto rounded-2xl border border-white/10 vv-glass">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-xs text-white/50">
            <tr className="border-b border-white/10 text-left">
              <th className="p-3">Name</th><th>Email</th><th>Role</th><th>Status</th><th>Events</th><th>Joined</th><th></th>
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
                  {u.id !== adminId && (
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

      <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
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

// ---------------------------------------------------------------------------
// Generic read-only data tab for the other seven sections.
// ---------------------------------------------------------------------------

type Column = { key: string; label: string; render?: (row: Record<string, unknown>) => React.ReactNode };

function DataTab({ entity, onError }: { entity: Exclude<TabKey, "users">; onError: (m: string | null) => void }) {
  const [data, setData] = useState<DataResp | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search.trim()) qs.set("search", search.trim());
    try {
      setData(await apiGet<DataResp>(`/api/admin/data/${entity}?${qs}`));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [entity, page, search, onError]);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo(() => COLUMNS[entity], [entity]);
  const minWidth = columns.length * 130 + 180;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search…"
          className="min-w-[200px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <span className="text-xs text-white/50">{data ? `${data.total} record${data.total === 1 ? "" : "s"}` : ""}</span>
      </div>

      <div className="vv-scroll mt-4 overflow-x-auto rounded-2xl border border-white/10 vv-glass">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead className="text-xs text-white/50">
            <tr className="border-b border-white/10 text-left">
              <th className="p-3">User</th>
              {columns.map((c) => <th key={c.key} className="px-2">{c.label}</th>)}
              <th className="px-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={String(r.id)} className="border-b border-white/5 align-top">
                <td className="p-3">{renderOwner(r.owner as Owner)}</td>
                {columns.map((c) => <td key={c.key} className="px-2 py-2 text-white/80">{c.render ? c.render(r) : fallback(r[c.key])}</td>)}
                <td className="px-2 py-2 text-white/45">{r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
            {data && data.rows.length === 0 && !loading && (
              <tr><td colSpan={columns.length + 2} className="p-6 text-center text-white/50">No records yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={columns.length + 2} className="p-6 text-center text-white/40">Loading…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pager page={data?.page ?? 1} pages={data?.pages ?? 1} onPrev={() => setPage((p) => p - 1)} onNext={() => setPage((p) => p + 1)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Column definitions per section.
// ---------------------------------------------------------------------------

const eventLink = (row: Record<string, unknown>) => {
  const e = row.event as EventRef;
  return e ? <span className="text-white/80">{e.title}</span> : <span className="text-white/40">—</span>;
};

const COLUMNS: Record<Exclude<TabKey, "users">, Column[]> = {
  events: [
    { key: "title", label: "Event" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "city", label: "City" },
    { key: "guestCount", label: "Guests" },
    { key: "budget", label: "Budget", render: (r) => (Number(r.budget) > 0 ? formatINR(Number(r.budget)) : "—") },
    { key: "startDate", label: "Date", render: (r) => (r.startDate ? new Date(String(r.startDate)).toLocaleDateString("en-IN") : "—") },
  ],
  aiplans: [
    { key: "kind", label: "Kind", render: (r) => <span className="rounded-full bg-peacock-400/15 px-2 py-0.5 text-[11px] text-peacock-400">{String(r.kind)}</span> },
    { key: "provider", label: "Provider" },
    { key: "event", label: "Event", render: eventLink },
    { key: "generated", label: "AI", render: (r) => (r.generated ? "Generated" : "Manual") },
  ],
  venues: [
    { key: "venueName", label: "Venue" },
    { key: "city", label: "City" },
    { key: "source", label: "Source" },
    { key: "rating", label: "Rating", render: (r) => (r.rating != null ? String(r.rating) : "—") },
    { key: "selected", label: "Selected", render: (r) => (r.selected ? "★ Selected" : "Shortlist") },
    { key: "event", label: "Event", render: eventLink },
  ],
  budgets: [
    { key: "category", label: "Category" },
    { key: "label", label: "Item" },
    { key: "quantity", label: "Qty" },
    { key: "est", label: "Estimate", render: (r) => `${formatINR(Number(r.estMin))} – ${formatINR(Number(r.estMax))}` },
    { key: "estimated", label: "Type", render: (r) => (r.estimated ? "Estimate" : "Confirmed") },
    { key: "event", label: "Event", render: eventLink },
  ],
  vendors: [
    { key: "vendorName", label: "Vendor" },
    { key: "category", label: "Category" },
    { key: "city", label: "City" },
    { key: "status", label: "Status", render: (r) => <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/70">{String(r.status)}</span> },
    { key: "agreedCost", label: "Agreed", render: (r) => (r.agreedCost != null ? formatINR(Number(r.agreedCost)) : "—") },
    { key: "hasEnquiry", label: "Enquiry", render: (r) => (r.hasEnquiry ? "Yes" : "—") },
    { key: "event", label: "Event", render: eventLink },
  ],
  themes: [
    { key: "theme", label: "Theme", render: (r) => (r.theme ? String(r.theme) : "—") },
    { key: "foodStyle", label: "Food style" },
    { key: "dietary", label: "Dietary" },
    { key: "estimated", label: "Type", render: (r) => (r.estimated ? "Estimate" : "Confirmed") },
    { key: "event", label: "Event", render: eventLink },
  ],
  timelines: [
    { key: "title", label: "Task" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status", render: (r) => <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusTone(String(r.status), Boolean(r.done))}`}>{r.done ? "completed" : String(r.status)}</span> },
    { key: "dueDate", label: "Due", render: (r) => (r.dueDate ? new Date(String(r.dueDate)).toLocaleDateString("en-IN") : "—") },
    { key: "assignee", label: "Assignee", render: (r) => (r.assignee ? String(r.assignee) : "—") },
    { key: "event", label: "Event", render: eventLink },
  ],
};

function statusTone(status: string, done: boolean): string {
  if (done || status === "completed") return "bg-emerald-400/15 text-emerald-300";
  if (status === "overdue") return "bg-kumkum-500/30 text-red-200";
  if (status === "in-progress") return "bg-saffron-500/20 text-saffron-400";
  return "bg-white/5 text-white/60";
}

// ---------------------------------------------------------------------------
// Shared bits.
// ---------------------------------------------------------------------------

function renderOwner(owner: Owner) {
  if (!owner) return <span className="text-white/40">—</span>;
  return (
    <Link href={`/admin/users/${owner.id}`} className="block hover:underline">
      <span className="font-medium text-white/90">{owner.name ?? "—"}</span>
      <span className="block text-[11px] text-white/45">{owner.email}</span>
    </Link>
  );
}

function fallback(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return <span className="text-white/40">—</span>;
  return String(v);
}

function Pager({ page, pages, onPrev, onNext }: { page: number; pages: number; onPrev: () => void; onNext: () => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <button disabled={page <= 1} onClick={onPrev} className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40">← Prev</button>
      <span className="text-white/60">Page {page} of {pages}</span>
      <button disabled={page >= pages} onClick={onNext} className="rounded-lg border border-white/15 px-3 py-1 disabled:opacity-40">Next →</button>
    </div>
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
