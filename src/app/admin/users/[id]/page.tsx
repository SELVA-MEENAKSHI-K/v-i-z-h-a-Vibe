"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { apiGet } from "@/lib/client";
import { useAuth } from "@/lib/useAuth";

type Detail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  eventCount: number;
  plansGenerated: number;
  events: { id: string; title: string; city: string; startDate: string | null; createdAt: string }[];
};

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "ADMIN") return;
    apiGet<Detail>(`/api/admin/users/${id}`).then(setD).catch((e) => setErr(e instanceof Error ? e.message : "Failed."));
  }, [id, user, loading]);

  if (!loading && (!user || user.role !== "ADMIN")) {
    return (<><Header /><main className="mx-auto max-w-lg px-4 py-20 text-center"><h1 className="font-display text-2xl font-semibold">Unauthorized</h1><Link href="/" className="mt-4 inline-block text-saffron-400">Home</Link></main></>);
  }

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin" className="text-sm text-peacock-400 hover:underline">← Back to users</Link>
        {err && <div className="mt-4 rounded-lg border border-kumkum-500/40 bg-kumkum-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}
        {d && (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold">{d.name ?? "—"}</h1>
            <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 vv-glass p-5 text-sm sm:grid-cols-2">
              <KV k="Email" v={d.email ?? "—"} />
              <KV k="Mobile" v={d.phone ?? "—"} />
              <KV k="Role" v={d.role} />
              <KV k="Status" v={d.status} />
              <KV k="Joined" v={new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              <KV k="Events / AI plans" v={`${d.eventCount} / ${d.plansGenerated}`} />
            </div>

            <h2 className="mt-6 font-semibold">Events ({d.events.length})</h2>
            <div className="mt-2 space-y-2">
              {d.events.length === 0 && <p className="text-sm text-white/50">No events created.</p>}
              {d.events.map((e) => (
                <div key={e.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-white/55">
                    {e.city} · {e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN") : "no date"} · created {new Date(e.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
