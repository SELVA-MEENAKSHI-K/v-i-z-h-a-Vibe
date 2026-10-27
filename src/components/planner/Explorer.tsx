"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Plan, PlanObject } from "./types";
import { OBJECT_KINDS } from "./types";
import type { CameraPreset } from "./VenueScene";
import { Plan2D } from "./Plan2D";
import { seatingStatus } from "@/lib/seating";
import { apiSend } from "@/lib/client";

// Lazy-load the heavy 3D scene; it never runs on the server.
const VenueScene = dynamic(() => import("./VenueScene"), {
  ssr: false,
  loading: () => <SceneSkeleton />,
});

function SceneSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-white/60">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-saffron-500" />
        <p className="text-sm">Loading the 3D venue…</p>
      </div>
    </div>
  );
}

let tempId = 0;
function newId() {
  tempId += 1;
  return `tmp-${Date.now()}-${tempId}`;
}

export function Explorer({ plan, onSaved }: { plan: Plan; onSaved: (p: Plan) => void }) {
  const [roomWidth, setRoomWidth] = useState(plan.layout?.roomWidth ?? 26);
  const [roomDepth, setRoomDepth] = useState(plan.layout?.roomDepth ?? 20);
  const [objects, setObjects] = useState<PlanObject[]>(plan.layout?.objects ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preset, setPreset] = useState<CameraPreset>("orbit");
  const [view, setView] = useState<"3d" | "2d">("3d");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  // Detect WebGL support for the unsupported-device state.
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglOk(false);
        setView("2d");
      }
    } catch {
      setWebglOk(false);
      setView("2d");
    }
  }, []);

  const selected = useMemo(() => objects.find((o) => o.id === selectedId) ?? null, [objects, selectedId]);
  const status = useMemo(() => seatingStatus(plan.guestCount, objects), [plan.guestCount, objects]);

  const update = useCallback((id: string, patch: Partial<PlanObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    setDirty(true);
  }, []);

  const move = useCallback((id: string, x: number, z: number) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, posX: x, posZ: z } : o)));
    setDirty(true);
  }, []);

  function addObject(kind: string, seats: number) {
    const obj: PlanObject = {
      id: newId(),
      kind,
      label: OBJECT_KINDS.find((k) => k.kind === kind)?.label ?? kind,
      posX: 0,
      posY: 0,
      posZ: 0,
      rotY: 0,
      scale: 1,
      seats,
      style: null,
    };
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
    setDirty(true);
  }

  function removeSelected() {
    if (!selectedId) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    setDirty(true);
  }

  function autoFill() {
    // Add round tables until there are enough seats for all guests.
    const perTable = 8;
    const needed = Math.max(0, plan.guestCount - status.seatsConfigured);
    const toAdd = Math.ceil(needed / perTable);
    const extras: PlanObject[] = [];
    const cols = Math.max(1, Math.floor((roomWidth - 6) / 3.2));
    let count = objects.filter((o) => o.kind === "round-table").length;
    for (let i = 0; i < toAdd; i++) {
      const idx = count + i;
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      extras.push({
        id: newId(),
        kind: "round-table",
        label: `Table ${idx + 1}`,
        posX: Number((-((cols - 1) * 3.2) / 2 + c * 3.2).toFixed(2)),
        posY: 0,
        posZ: Number((-roomDepth / 2 + 8 + r * 3.2).toFixed(2)),
        rotY: 0,
        scale: 1,
        seats: perTable,
        style: null,
      });
    }
    setObjects((prev) => [...prev, ...extras]);
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await apiSend<Plan>(`/api/plans/${plan.shareToken}/layout`, "POST", {
        roomWidth,
        roomDepth,
        objects: objects.map(({ id, ...rest }) => rest),
      });
      onSaved(updated);
      setObjects(updated.layout?.objects ?? []);
      setDirty(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save layout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      {/* Viewport */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900" style={{ height: "clamp(420px, 60vh, 680px)" }}>
        {/* Toolbar */}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10 vv-glass text-xs">
            <button
              onClick={() => setView("3d")}
              disabled={!webglOk}
              className={`px-3 py-1.5 ${view === "3d" ? "bg-saffron-500 text-ink-900" : "text-white/80"} disabled:opacity-40`}
            >
              3D
            </button>
            <button onClick={() => setView("2d")} className={`px-3 py-1.5 ${view === "2d" ? "bg-saffron-500 text-ink-900" : "text-white/80"}`}>
              2D plan
            </button>
          </div>
          {view === "3d" && webglOk && (
            <div className="flex overflow-hidden rounded-lg border border-white/10 vv-glass text-xs">
              {(["orbit", "top", "stage", "entrance"] as CameraPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={`px-2.5 py-1.5 capitalize ${preset === p ? "bg-white/15 text-white" : "text-white/70"}`}
                  title={`${p} view`}
                >
                  {p === "orbit" ? "Reset" : p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Seating status overlay */}
        <div className="absolute right-3 top-3 z-10 rounded-lg border border-white/10 vv-glass px-3 py-2 text-xs">
          <div className="font-medium text-white">
            {status.seatsConfigured} / {plan.guestCount} seats
          </div>
          <div className={status.shortfall > 0 ? "text-amber-300" : "text-peacock-400"}>
            {status.shortfall > 0 ? `${status.shortfall} guests need seats` : "All guests seated"}
          </div>
        </div>

        {!webglOk && (
          <div className="absolute inset-x-0 top-14 z-10 mx-auto w-fit rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
            3D isn&apos;t supported on this device — showing the 2D plan instead.
          </div>
        )}

        {view === "3d" && webglOk ? (
          <VenueScene
            roomWidth={roomWidth}
            roomDepth={roomDepth}
            objects={objects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={move}
            cameraPreset={preset}
          />
        ) : (
          <Plan2D roomWidth={roomWidth} roomDepth={roomDepth} objects={objects} selectedId={selectedId} onSelect={setSelectedId} />
        )}

        {/* Illustrative disclaimer */}
        <div className="absolute bottom-2 left-3 z-10 text-[10px] text-white/40">
          Illustrative layout — not an architectural replica of the venue.
        </div>
      </div>

      {/* Editor panel */}
      <aside className="vv-scroll max-h-[680px] overflow-y-auto rounded-2xl border border-white/10 vv-glass p-4">
        <h3 className="font-semibold">Layout tools</h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {OBJECT_KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => addObject(k.kind, k.seats)}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
            >
              + {k.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={autoFill} className="flex-1 rounded-lg bg-peacock-600 px-3 py-2 text-sm font-medium text-white hover:bg-peacock-500">
            Auto-fill seating
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex-1 rounded-lg bg-saffron-500 px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-saffron-400 disabled:opacity-50"
          >
            {saving ? "Saving…" : dirty ? "Save layout" : "Saved"}
          </button>
        </div>

        {/* Room size */}
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
          <label className="block">
            <span className="text-xs text-white/60">Room width (m)</span>
            <input
              type="number"
              min={4}
              max={100}
              value={roomWidth}
              onChange={(e) => {
                setRoomWidth(Number(e.target.value));
                setDirty(true);
              }}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/60">Room depth (m)</span>
            <input
              type="number"
              min={4}
              max={100}
              value={roomDepth}
              onChange={(e) => {
                setRoomDepth(Number(e.target.value));
                setDirty(true);
              }}
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
            />
          </label>
        </div>

        <hr className="my-5 border-white/10" />

        {/* Selected object editor */}
        {selected ? (
          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected: {selected.label || selected.kind}</h4>
              <button onClick={removeSelected} className="text-xs text-red-300 hover:text-red-200">
                Delete
              </button>
            </div>
            <label className="mt-3 block text-sm">
              <span className="text-xs text-white/60">Label</span>
              <input
                value={selected.label ?? ""}
                onChange={(e) => update(selected.id, { label: e.target.value })}
                className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <NumberField label="X" value={selected.posX} onChange={(v) => update(selected.id, { posX: v })} step={0.5} />
              <NumberField label="Z" value={selected.posZ} onChange={(v) => update(selected.id, { posZ: v })} step={0.5} />
              <NumberField
                label="Rotation°"
                value={Math.round((selected.rotY * 180) / Math.PI)}
                onChange={(v) => update(selected.id, { rotY: (v * Math.PI) / 180 })}
                step={15}
              />
              <NumberField label="Scale" value={selected.scale} onChange={(v) => update(selected.id, { scale: v })} step={0.1} min={0.2} />
              <NumberField label="Seats" value={selected.seats} onChange={(v) => update(selected.id, { seats: Math.max(0, Math.round(v)) })} step={1} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/50">
            Select an object in the scene (or 2D plan) to edit its position, rotation, seats, and style. Drag objects in 3D to
            reposition them.
          </p>
        )}

        <hr className="my-5 border-white/10" />
        <div className="text-xs text-white/55">
          <div className="flex justify-between">
            <span>Objects</span>
            <span>{objects.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Tables</span>
            <span>{objects.filter((o) => o.kind.includes("table")).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Utilization</span>
            <span>{status.utilizationPct}%</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/60">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? Number(value.toFixed(2)) : 0}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
      />
    </label>
  );
}
